import dayjs from "dayjs";
import { Between, EntityManager, In } from "typeorm";
import { AppDataSourceProd } from "../database/dataBaseDev";
import { Account } from "../entities/Account.entity";
import { CreditCardCharge } from "../entities/CreditCardCharge.entity";
import { CreditCardDocument } from "../entities/CreditCardDocument.entity";
import { CreditInstallment } from "../entities/CreditInstallment.entity";
import { CreditInstallmentPlan } from "../entities/CreditInstallmentPlan.entity";
import { Transaction } from "../entities/Transaction.entity";
import { User } from "../entities/User.entity";
import { BadRequestError, ConflictError, NotFoundError } from "../helpers/errors/domain.errors";
import { toTransactionResponse } from "../mappers/TransactionMapper";
import { TransactionResponse } from "../ResponseInterfaces/TransactionInterface";
import { toAccountResponse } from "../mappers/AccountMapper";
import { CreateChargeSchema, CreateInstallmentPlanSchema, UpdateChargeSchema } from "../schemas/creditCard.schema";
import {
    CreditCardChargeResponse,
    CreditCardCycleResponse,
    CreditCardDocumentResponse,
    CreditCardForecastItemResponse,
    CreditCardInstallmentResponse,
    CreditCardPendingResponse,
    CreditCardPlanPreviewResponse,
    CreditCardPlanResponse,
    CreditCardSummaryResponse,
    MerchantAdjustmentResponse,
} from "../ResponseInterfaces/CreditCardResponse";
import {
    CreditChargeSource,
    CreditChargeType,
    CreditDocumentType,
    CreditInstallmentStatus,
    CreditInstallmentPlanStatus,
    CreditTransactionStatus,
    TypeAccount,
    TypeTransaction,
} from "../utils/Enums";
import {
    allocatePaymentsToBilledItems,
    buildInstallmentSchedule,
    closingDateForDueDate,
    cycleForDate,
    dueDateForClosing,
    nextDueDate,
    toYmd,
} from "../utils/creditCard";
import { getCreditCardDebt, getMaxBalance } from "../utils/getBalanceToCreditCard";
import { money } from "../utils/normalizarMoney";

export const MAX_CREDIT_DOCUMENT_SIZE = 5 * 1024 * 1024;

const ALLOWED_DOCUMENT_TYPES = new Set([
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
]);

const isAllowedDocumentType = (mimeType: string) =>
    mimeType.startsWith("image/") || ALLOWED_DOCUMENT_TYPES.has(mimeType);

interface SummaryItem {
    id: string;
    kind: "PURCHASE" | "INSTALLMENT" | "CHARGE";
    name: string;
    amount: number;
    paid: number;
    closingDate: string;
    dueDate: string;
    date: string;
}

export interface UploadedCreditDocument {
    name: string;
    type: string;
    size: number;
    data: Buffer;
}

const toChargeResponse = (charge: CreditCardCharge): CreditCardChargeResponse => ({
    id: charge.id,
    type: charge.type,
    source: charge.source,
    ...(charge.rate != null ? { rate: charge.rate } : {}),
    ...(charge.baseAmount != null ? { baseAmount: money(charge.baseAmount) } : {}),
    amount: money(charge.amount),
    ...(charge.periodKey ? { periodKey: charge.periodKey } : {}),
    closingDate: charge.closingDate,
    dueDate: charge.dueDate,
    ...(charge.installmentId ? { installmentId: charge.installmentId } : {}),
    ...(charge.description ? { description: charge.description } : {}),
    ignored: charge.ignored,
    recurring: charge.type === CreditChargeType.INSURANCE,
    fixed: charge.type === CreditChargeType.INSURANCE && charge.source === CreditChargeSource.AUTO,
});

const toInstallmentResponse = (installment: CreditInstallment): CreditCardInstallmentResponse => ({
    id: installment.id,
    number: installment.number,
    closingDate: installment.closingDate,
    dueDate: installment.dueDate,
    principal: money(installment.principal),
    interest: money(installment.interest),
    total: money(installment.total),
    status: installment.status,
    paidAmount: money(installment.paidAmount),
});

const toPlanResponse = (plan: CreditInstallmentPlan): CreditCardPlanResponse => ({
    id: plan.id,
    tea: plan.tea,
    principal: money(plan.principal),
    installmentsCount: plan.installmentsCount,
    firstDueDate: plan.firstDueDate,
    totalInterest: money(plan.totalInterest),
    totalAmount: money(plan.totalAmount),
    status: plan.status,
    installments: (plan.installments ?? [])
        .sort((a, b) => a.number - b.number)
        .map(toInstallmentResponse),
});

const toDocumentResponse = (document: CreditCardDocument): CreditCardDocumentResponse => ({
    id: document.id,
    fileName: document.fileName,
    mimeType: document.mimeType,
    size: document.size,
    type: document.type,
    extractedData: document.extractedData ?? null,
    createdAt: document.createdAt,
});

export class CreditCardService {
    private accountRepo = AppDataSourceProd.getRepository(Account);
    private transactionRepo = AppDataSourceProd.getRepository(Transaction);
    private planRepo = AppDataSourceProd.getRepository(CreditInstallmentPlan);
    private chargeRepo = AppDataSourceProd.getRepository(CreditCardCharge);
    private documentRepo = AppDataSourceProd.getRepository(CreditCardDocument);

    private async getCard(accountId: string, userId: string, manager?: EntityManager): Promise<Account> {
        const repo = manager ? manager.getRepository(Account) : this.accountRepo;
        const account = await repo.findOne({
            where: { id: accountId, user: { id: userId } },
        });
        if (!account) throw new NotFoundError("Tarjeta no encontrada o no pertenece al usuario");
        if (account.type !== TypeAccount.CREDIT) {
            throw new BadRequestError("La cuenta no es una tarjeta de credito");
        }
        return account;
    }

    private async ensureAutoCharges(card: Account, userId: string): Promise<void> {
        const expenses = await this.transactionRepo.find({
            where: {
                account: { id: card.id },
                user: { id: userId },
                type: TypeTransaction.EXPENSE,
                creditStatus: CreditTransactionStatus.POSTED,
            },
            order: { date: "ASC" },
        });

        const plans = await this.planRepo.find({
            where: {
                account: { id: card.id },
                user: { id: userId },
                status: CreditInstallmentPlanStatus.ACTIVE,
            },
            relations: ["installments"],
        });

        const existing = await this.chargeRepo.find({
            where: { account: { id: card.id }, user: { id: userId } },
        });
        const today = dayjs().startOf("day");
        const trackingStart = dayjs(card.creditTrackingStartedAt ?? card.createdAt).startOf("day");
        const closeDay = card.billingCloseDay || 1;
        const dueDay = card.paymentDueDay || 1;
        const chargesToCreate: Array<Partial<CreditCardCharge>> = [];

        if ((card.desgravamenRate ?? 0) > 0) {
            const byCycle = new Map<string, { purchases: number; closingDate: string; dueDate: string; periodKey: string }>();
            for (const transaction of expenses) {
                if (transaction.creditStatus !== CreditTransactionStatus.POSTED) continue;
                const cycle = cycleForDate(transaction.date, closeDay, dueDay);
                const current = byCycle.get(cycle.closingDate) ?? {
                    purchases: 0,
                    closingDate: cycle.closingDate,
                    dueDate: cycle.dueDate,
                    periodKey: cycle.periodKey,
                };
                current.purchases += transaction.amount;
                byCycle.set(cycle.closingDate, current);
            }

            for (const cycle of byCycle.values()) {
                if (dayjs(cycle.closingDate).isBefore(trackingStart, "day")) continue;
                if (!dayjs(cycle.closingDate).isAfter(today, "day")) {
                    const exists = existing.some(
                        (charge) =>
                            charge.type === CreditChargeType.INSURANCE &&
                            charge.periodKey === cycle.periodKey
                    );
                    if (exists) continue;

                    let amount = Math.round((cycle.purchases * (card.desgravamenRate ?? 0)) / 100);
                    if (card.desgravamenMaxAmount != null) {
                        amount = Math.min(amount, card.desgravamenMaxAmount);
                    }
                    if (amount <= 0) continue;

                    chargesToCreate.push({
                        account: card,
                        accountId: card.id,
                        userId,
                        type: CreditChargeType.INSURANCE,
                        source: CreditChargeSource.AUTO,
                        rate: card.desgravamenRate,
                        baseAmount: cycle.purchases,
                        amount,
                        periodKey: cycle.periodKey,
                        closingDate: cycle.closingDate,
                        dueDate: cycle.dueDate,
                        description: `Seguro de desgravamen ${cycle.periodKey}`,
                    });
                }
            }
        }

        for (const plan of plans) {
            const installments = [...(plan.installments ?? [])].sort((a, b) => a.number - b.number);
            let remainingPrincipal = plan.principal;
            for (const installment of installments) {
                if (
                    installment.interest > 0 &&
                    !dayjs(installment.closingDate).isBefore(trackingStart, "day") &&
                    !dayjs(installment.closingDate).isAfter(today, "day")
                ) {
                    const exists = existing.some(
                        (charge) =>
                            charge.type === CreditChargeType.INTEREST &&
                            charge.installmentId === installment.id
                    );
                    if (!exists && !chargesToCreate.some((charge) => charge.installmentId === installment.id)) {
                        const monthlyRate = plan.tea > 0
                            ? (Math.pow(1 + plan.tea / 100, 1 / 12) - 1) * 100
                            : 0;
                        chargesToCreate.push({
                            account: card,
                            accountId: card.id,
                            userId,
                            type: CreditChargeType.INTEREST,
                            source: CreditChargeSource.AUTO,
                            rate: monthlyRate,
                            baseAmount: remainingPrincipal,
                            amount: installment.interest,
                            periodKey: installment.closingDate.slice(0, 7),
                            closingDate: installment.closingDate,
                            dueDate: installment.dueDate,
                            installmentId: installment.id,
                            description: `Interes cuota ${installment.number}/${plan.installmentsCount}`,
                        });
                    }
                }
                remainingPrincipal = Math.max(0, remainingPrincipal - installment.principal);
            }
        }

        for (const payload of chargesToCreate) {
            await AppDataSourceProd.transaction(async (manager) => {
                const account = await manager.findOne(Account, {
                    where: { id: card.id },
                    lock: { mode: "pessimistic_write" },
                });
                if (!account) return;
                const charge = manager.create(CreditCardCharge, payload);
                account.balance -= payload.amount ?? 0;
                await manager.save(account);
                await manager.save(charge);
            });
        }
    }

    private async recalculateInsuranceForCycle(
        manager: EntityManager,
        card: Account,
        userId: string,
        cycle: { closingDate: string; dueDate: string; periodKey: string }
    ): Promise<void> {
        if ((card.desgravamenRate ?? 0) <= 0) return;
        if (dayjs(cycle.closingDate).isAfter(dayjs().startOf("day"), "day")) return;
        const trackingStart = dayjs(card.creditTrackingStartedAt ?? card.createdAt).startOf("day");
        if (dayjs(cycle.closingDate).isBefore(trackingStart, "day")) return;

        const expenses = await manager.find(Transaction, {
            where: {
                account: { id: card.id },
                user: { id: userId },
                type: TypeTransaction.EXPENSE,
                creditStatus: CreditTransactionStatus.POSTED,
            },
        });
        const closeDay = card.billingCloseDay || 1;
        const dueDay = card.paymentDueDay || 1;
        const baseAmount = expenses
            .filter((expense) => cycleForDate(expense.date, closeDay, dueDay).closingDate === cycle.closingDate)
            .reduce((sum, expense) => sum + expense.amount, 0);

        let desired = Math.round((baseAmount * (card.desgravamenRate ?? 0)) / 100);
        if (card.desgravamenMaxAmount != null) {
            desired = Math.min(desired, card.desgravamenMaxAmount);
        }

        const existing = await manager.findOne(CreditCardCharge, {
            where: {
                account: { id: card.id },
                type: CreditChargeType.INSURANCE,
                periodKey: cycle.periodKey,
            },
        });

        if (existing) {
            if (existing.ignored || existing.source !== CreditChargeSource.AUTO) return;
            if (existing.amount === desired && existing.baseAmount === baseAmount) return;
            card.balance -= desired - existing.amount;
            existing.amount = desired;
            existing.baseAmount = baseAmount;
            existing.rate = card.desgravamenRate;
            await manager.save(card);
            await manager.save(existing);
            return;
        }

        if (desired <= 0) return;
        const charge = manager.create(CreditCardCharge, {
            account: card,
            accountId: card.id,
            userId,
            type: CreditChargeType.INSURANCE,
            source: CreditChargeSource.AUTO,
            rate: card.desgravamenRate,
            baseAmount,
            amount: desired,
            periodKey: cycle.periodKey,
            closingDate: cycle.closingDate,
            dueDate: cycle.dueDate,
            description: `Seguro de desgravamen ${cycle.periodKey}`,
        });
        card.balance -= desired;
        await manager.save(card);
        await manager.save(charge);
    }

    async getSummary(
        accountId: string,
        userId: string,
        options: { ensureCharges?: boolean } = {}
    ): Promise<CreditCardSummaryResponse> {
        const card = await this.getCard(accountId, userId);
        if (options.ensureCharges !== false) {
            await this.ensureAutoCharges(card, userId);
        }
        const refreshedCard = await this.getCard(accountId, userId);
        card.balance = refreshedCard.balance;
        card.creditTrackingStartedAt = refreshedCard.creditTrackingStartedAt;

        const [expenses, plans, charges] = await Promise.all([
            this.transactionRepo.find({
                where: {
                    account: { id: card.id },
                    user: { id: userId },
                    type: TypeTransaction.EXPENSE,
                },
                order: { date: "ASC", createdAt: "ASC" },
            }),
            this.planRepo.find({
                where: { account: { id: card.id }, user: { id: userId } },
                relations: ["installments"],
                order: { createdAt: "ASC" },
            }),
            this.chargeRepo.find({
                where: { account: { id: card.id }, user: { id: userId }, ignored: false },
                order: { dueDate: "ASC", createdAt: "ASC" },
            }),
        ]);

        const payments = await this.transactionRepo.find({
            where: {
                relatedAccount: { id: card.id },
                user: { id: userId },
                type: TypeTransaction.CREDIT_PAYMENT,
            },
            order: { date: "ASC", createdAt: "ASC" },
        });

        const closeDay = card.billingCloseDay || 1;
        const dueDay = card.paymentDueDay || 1;
        const today = dayjs().startOf("day");
        const pendingTransactions = expenses
            .filter((transaction) => transaction.creditStatus === CreditTransactionStatus.PENDING)
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        const postedExpenses = expenses.filter(
            (transaction) =>
                transaction.creditStatus === CreditTransactionStatus.POSTED &&
                !transaction.installmentPlanId
        );

        const items: SummaryItem[] = postedExpenses.map((transaction) => {
            const cycle = cycleForDate(transaction.date, closeDay, dueDay);
            return {
                id: transaction.id,
                kind: "PURCHASE",
                name: transaction.name,
                amount: transaction.amount,
                paid: 0,
                closingDate: cycle.closingDate,
                dueDate: cycle.dueDate,
                date: transaction.date,
            };
        });

        for (const plan of plans) {
            if (plan.status !== CreditInstallmentPlanStatus.ACTIVE) continue;
            for (const installment of plan.installments ?? []) {
                if (installment.status === CreditInstallmentStatus.CANCELLED) continue;
                items.push({
                    id: installment.id,
                    kind: "INSTALLMENT",
                    name: `Cuota ${installment.number}/${plan.installmentsCount}`,
                    amount: installment.principal,
                    paid: installment.paidAmount,
                    closingDate: installment.closingDate,
                    dueDate: installment.dueDate,
                    date: installment.closingDate,
                });
            }
        }

        for (const charge of charges) {
            if (charge.amount <= 0) continue;
            items.push({
                id: charge.id,
                kind: "CHARGE",
                name: charge.description ?? charge.type,
                amount: charge.amount,
                paid: 0,
                closingDate: charge.closingDate,
                dueDate: charge.dueDate,
                date: charge.closingDate,
            });
        }

        const kindPriority: Record<SummaryItem["kind"], number> = {
            CHARGE: 0,
            INSTALLMENT: 1,
            PURCHASE: 2,
        };
        items.sort((a, b) => {
            const due = a.dueDate.localeCompare(b.dueDate);
            if (due !== 0) return due;
            const priority = kindPriority[a.kind] - kindPriority[b.kind];
            return priority !== 0 ? priority : a.date.localeCompare(b.date);
        });

        allocatePaymentsToBilledItems(
            items,
            payments.map((payment) => ({
                amount: payment.amount,
                date: payment.date,
            }))
        );

        const itemById = new Map(items.map((item) => [item.id, item]));
        for (const plan of plans) {
            for (const installment of plan.installments ?? []) {
                const item = itemById.get(installment.id);
                if (!item) continue;
                installment.paidAmount = item.paid;
                installment.status =
                    item.paid >= installment.principal
                        ? CreditInstallmentStatus.PAID
                        : dayjs(installment.dueDate).isBefore(today, "day")
                            ? CreditInstallmentStatus.OVERDUE
                            : CreditInstallmentStatus.PENDING;
            }
            if (
                plan.installments?.length &&
                plan.installments.every((installment) => installment.status === CreditInstallmentStatus.PAID)
            ) {
                plan.status = CreditInstallmentPlanStatus.COMPLETED;
            }
        }

        const cycleMap = new Map<string, CreditCardCycleResponse>();
        for (const item of items) {
            const cycle = cycleMap.get(item.closingDate) ?? {
                closingDate: item.closingDate,
                dueDate: item.dueDate,
                periodKey: item.closingDate.slice(0, 7),
                purchases: 0,
                installmentsPrincipal: 0,
                charges: 0,
                total: 0,
                paid: 0,
                remaining: 0,
                status: "OPEN" as CreditCardCycleResponse["status"],
            };

            if (item.kind === "PURCHASE") cycle.purchases += item.amount;
            if (item.kind === "INSTALLMENT") cycle.installmentsPrincipal += item.amount;
            if (item.kind === "CHARGE") cycle.charges += item.amount;
            cycle.total += item.amount;
            cycle.paid += item.paid;
            cycle.remaining = Math.max(0, cycle.total - cycle.paid);
            cycleMap.set(item.closingDate, cycle);
        }

        for (const cycle of cycleMap.values()) {
            if (cycle.remaining <= 0) {
                cycle.status = "PAID";
            } else if (dayjs(cycle.closingDate).isAfter(today, "day")) {
                cycle.status = "OPEN";
            } else if (dayjs(cycle.dueDate).isBefore(today, "day")) {
                cycle.status = "OVERDUE";
            } else {
                cycle.status = "CLOSED";
            }
        }

        const cycles = [...cycleMap.values()]
            .map((cycle) => ({
                ...cycle,
                purchases: money(cycle.purchases),
                installmentsPrincipal: money(cycle.installmentsPrincipal),
                charges: money(cycle.charges),
                total: money(cycle.total),
                paid: money(cycle.paid),
                remaining: money(cycle.remaining),
            }))
            .sort((a, b) => b.closingDate.localeCompare(a.closingDate));

        const closedCycles = [...cycleMap.values()]
            .filter((cycle) => !dayjs(cycle.closingDate).isAfter(today, "day"))
            .sort((a, b) => b.closingDate.localeCompare(a.closingDate));
        const openCycles = [...cycleMap.values()]
            .filter((cycle) => dayjs(cycle.closingDate).isAfter(today, "day"))
            .sort((a, b) => a.closingDate.localeCompare(b.closingDate));

        const currentCycleEntity =
            closedCycles.find((cycle) => cycle.remaining > 0) ?? closedCycles[0] ?? openCycles[0];
        const nextCycleEntity = openCycles[0];

        const toCycleResponse = (cycle?: CreditCardCycleResponse): CreditCardCycleResponse | undefined =>
            cycle
                ? {
                    ...cycle,
                    purchases: money(cycle.purchases),
                    installmentsPrincipal: money(cycle.installmentsPrincipal),
                    charges: money(cycle.charges),
                    total: money(cycle.total),
                    paid: money(cycle.paid),
                    remaining: money(cycle.remaining),
                }
                : undefined;

        const nextDueDateValue = currentCycleEntity && currentCycleEntity.remaining > 0
            ? currentCycleEntity.dueDate
            : nextCycleEntity?.dueDate;
        const nextDueAmountCents = nextDueDateValue
            ? items
                .filter((item) => item.dueDate === nextDueDateValue)
                .reduce((sum, item) => sum + Math.max(0, item.amount - item.paid), 0)
            : 0;

        const billedDebtCents = closedCycles.reduce((sum, cycle) => sum + cycle.remaining, 0);
        const unbilledDebtCents = openCycles.reduce((sum, cycle) => sum + cycle.remaining, 0);
        const overdueDebtCents = items.reduce(
            (sum, item) =>
                dayjs(item.dueDate).isBefore(today, "day")
                    ? sum + Math.max(0, item.amount - item.paid)
                    : sum,
            0
        );

        const currentOpenCycle = openCycles[0];
        const cycleExpensesCents = currentOpenCycle
            ? postedExpenses
                .filter((transaction) => {
                    const cycle = cycleForDate(transaction.date, closeDay, dueDay);
                    return cycle.closingDate === currentOpenCycle.closingDate;
                })
                .reduce((sum, transaction) => sum + transaction.amount, 0)
            : 0;
        let insuranceEstimateCents = 0;
        if ((card.desgravamenRate ?? 0) > 0) {
            insuranceEstimateCents = Math.round(
                (cycleExpensesCents * (card.desgravamenRate ?? 0)) / 100
            );
            if (card.desgravamenMaxAmount != null) {
                insuranceEstimateCents = Math.min(insuranceEstimateCents, card.desgravamenMaxAmount);
            }
        }

        const maxCredit = getMaxBalance(card.creditLimit ?? 0, card.overdraft ?? 0);
        const totalDebt = getCreditCardDebt(card.creditLimit ?? 0, card.overdraft ?? 0, card.balance);
        const pending: CreditCardPendingResponse[] = pendingTransactions.map((transaction) => ({
            id: transaction.id,
            name: transaction.name,
            amount: money(transaction.amount),
            ...(transaction.authorizedAmount != null
                ? { authorizedAmount: money(transaction.authorizedAmount) }
                : {}),
            date: transaction.date,
            ...(transaction.time ? { time: transaction.time } : {}),
            ...(transaction.merchantName ? { merchantName: transaction.merchantName } : {}),
            ...(transaction.expectedPostAt ? { expectedPostAt: transaction.expectedPostAt } : {}),
            ready: transaction.expectedPostAt
                ? dayjs(transaction.expectedPostAt).isBefore(dayjs()) || dayjs(transaction.expectedPostAt).isSame(dayjs())
                : true,
            createdAt: transaction.createdAt,
        }));

        return {
            account: toAccountResponse(card),
            totalDebt: money(totalDebt),
            billedDebt: money(billedDebtCents),
            unbilledDebt: money(unbilledDebtCents),
            overdueDebt: money(overdueDebtCents),
            availableCredit: money(card.balance),
            maxCredit: money(maxCredit),
            usagePercent: maxCredit > 0 ? Math.round((totalDebt / maxCredit) * 100) : 0,
            ...(currentCycleEntity ? { currentStatement: toCycleResponse(currentCycleEntity) } : {}),
            ...(nextCycleEntity ? { nextStatement: toCycleResponse(nextCycleEntity) } : {}),
            ...(nextDueDateValue ? { nextDueDate: nextDueDateValue } : {}),
            nextDueAmount: money(nextDueAmountCents),
            pendingCount: pending.length,
            pendingReadyCount: pending.filter((item) => item.ready).length,
            pendingAmount: money(pendingTransactions.reduce((sum, transaction) => sum + transaction.amount, 0)),
            pending,
            cycles,
            plans: plans.map(toPlanResponse),
            charges: charges.map(toChargeResponse),
            eligiblePurchases: items
                .filter((item) => item.kind === "PURCHASE" && item.paid === 0)
                .map((item) => {
                    const transaction = postedExpenses.find((candidate) => candidate.id === item.id);
                    return {
                        id: item.id,
                        name: item.name,
                        date: item.date,
                        amount: money(item.amount),
                        ...(transaction?.merchantName ? { merchantName: transaction.merchantName } : {}),
                    };
                }),
            merchantAdjustments: this.buildMerchantAdjustments(postedExpenses),
            insuranceEstimate: money(insuranceEstimateCents),
            cycleExpenses: money(cycleExpensesCents),
        };
    }

    async getForecast(
        userId: string,
        from: string,
        to: string
    ): Promise<CreditCardForecastItemResponse[]> {
        const cards = await this.accountRepo.find({
            where: { user: { id: userId }, type: TypeAccount.CREDIT },
        });
        if (cards.length === 0) return [];

        const cardIds = cards.map((card) => card.id);
        const cardById = new Map(cards.map((card) => [card.id, card]));
        const [charges, plans, expenses] = await Promise.all([
            this.chargeRepo.find({
                where: {
                    user: { id: userId },
                    ignored: false,
                    dueDate: Between(from, to),
                },
            }),
            this.planRepo.find({
                where: {
                    user: { id: userId },
                    status: CreditInstallmentPlanStatus.ACTIVE,
                    account: { id: In(cardIds) },
                },
                relations: ["installments"],
            }),
            this.transactionRepo.find({
                where: {
                    user: { id: userId },
                    type: TypeTransaction.EXPENSE,
                    creditStatus: CreditTransactionStatus.POSTED,
                    account: { id: In(cardIds) },
                },
                relations: ["account"],
            }),
        ]);

        const items: CreditCardForecastItemResponse[] = [];
        const insuranceDates = new Set<string>();

        for (const charge of charges) {
            const card = cardById.get(charge.accountId);
            if (!card) continue;
            if (charge.type === CreditChargeType.INTEREST) continue;
            if (charge.type === CreditChargeType.INSURANCE) {
                insuranceDates.add(`${card.id}:${charge.dueDate}`);
            }
            items.push({
                id: charge.id,
                accountId: card.id,
                accountName: card.name,
                title: charge.description ?? (charge.type === CreditChargeType.INSURANCE
                    ? `Seguro desgravamen · ${card.name}`
                    : `Cargo de tarjeta · ${card.name}`),
                subtitle: `${card.name} · ${charge.type === CreditChargeType.INSURANCE
                    ? "Recurrente fijo"
                    : "Cargo programado"}`,
                amount: money(charge.amount),
                dueDate: charge.dueDate,
                type: "EXPENSE",
                source: charge.type === CreditChargeType.INSURANCE ? "INSURANCE" : "CHARGE",
                recurring: charge.type === CreditChargeType.INSURANCE,
                fixed: charge.type === CreditChargeType.INSURANCE && charge.source === CreditChargeSource.AUTO,
                estimated: false,
            });
        }

        for (const plan of plans) {
            const card = cardById.get(plan.accountId);
            if (!card) continue;
            for (const installment of plan.installments ?? []) {
                if (installment.status === CreditInstallmentStatus.CANCELLED) continue;
                if (installment.dueDate < from || installment.dueDate > to) continue;
                items.push({
                    id: installment.id,
                    accountId: card.id,
                    accountName: card.name,
                    title: `Cuota ${installment.number}/${plan.installmentsCount} · ${card.name}`,
                    subtitle: `${card.name} · Plan de cuotas`,
                    amount: money(installment.total),
                    dueDate: installment.dueDate,
                    type: "EXPENSE",
                    source: "INSTALLMENT",
                    recurring: true,
                    fixed: true,
                    estimated: false,
                });
            }
        }

        for (const card of cards) {
            if ((card.desgravamenRate ?? 0) <= 0) continue;
            if (!card.billingCloseDay || !card.paymentDueDay) continue;

            const cycle = this.insuranceCycleForRange(card, from, to);
            if (!cycle) continue;
            if (insuranceDates.has(`${card.id}:${cycle.dueDate}`)) continue;

            const today = dayjs().startOf("day");
            const trackingStart = dayjs(card.creditTrackingStartedAt ?? card.createdAt).startOf("day");
            if (dayjs(cycle.closingDate).isBefore(trackingStart, "day")) continue;

            const cycleIsClosed = !dayjs(cycle.closingDate).isAfter(today, "day");
            const cardExpenses = expenses.filter((expense) => expense.account?.id === card.id);
            let baseAmount = cardExpenses
                .filter((expense) =>
                    cycleForDate(expense.date, card.billingCloseDay!, card.paymentDueDay!).closingDate ===
                    cycle.closingDate
                )
                .reduce((sum, expense) => sum + expense.amount, 0);
            let estimated = !cycleIsClosed;

            if (baseAmount <= 0) {
                if (cycleIsClosed) continue;
                estimated = true;
                const byCycle = new Map<string, number>();
                for (const expense of cardExpenses) {
                    const expenseCycle = cycleForDate(
                        expense.date,
                        card.billingCloseDay,
                        card.paymentDueDay
                    );
                    byCycle.set(
                        expenseCycle.closingDate,
                        (byCycle.get(expenseCycle.closingDate) ?? 0) + expense.amount
                    );
                }
                const previous = [...byCycle.entries()]
                    .filter(([closingDate]) => closingDate < cycle.closingDate)
                    .sort((a, b) => b[0].localeCompare(a[0]))[0];
                baseAmount = previous?.[1] ?? 0;
            }

            if (baseAmount <= 0) continue;
            let amount = Math.round((baseAmount * (card.desgravamenRate ?? 0)) / 100);
            if (card.desgravamenMaxAmount != null) {
                amount = Math.min(amount, card.desgravamenMaxAmount);
            }
            if (amount <= 0) continue;

            items.push({
                id: `forecast-insurance-${card.id}-${cycle.periodKey}`,
                accountId: card.id,
                accountName: card.name,
                title: `Seguro desgravamen · ${card.name}`,
                subtitle: `${card.name} · Recurrente fijo${estimated ? " · estimado" : ""}`,
                amount: money(amount),
                dueDate: cycle.dueDate,
                type: "EXPENSE",
                source: "INSURANCE",
                recurring: true,
                fixed: true,
                estimated,
            });
        }

        return items.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    }

    private insuranceCycleForRange(
        card: Account,
        from: string,
        to: string
    ): { closingDate: string; dueDate: string; periodKey: string } | null {
        if (!card.billingCloseDay || !card.paymentDueDay) return null;
        const start = dayjs(from);
        for (const offset of [-1, 0]) {
            const base = start.add(offset, "month");
            const day = Math.min(card.billingCloseDay, base.daysInMonth());
            const closingDate = base.date(day).format("YYYY-MM-DD");
            const dueDate = dueDateForClosing(closingDate, card.paymentDueDay);
            if (dueDate >= from && dueDate <= to) {
                return { closingDate, dueDate, periodKey: closingDate.slice(0, 7) };
            }
        }
        return null;
    }

    private buildMerchantAdjustments(expenses: Transaction[]): MerchantAdjustmentResponse[] {
        const groups = new Map<string, Transaction[]>();
        for (const transaction of expenses) {
            if (!transaction.merchantName || transaction.authorizedAmount == null) continue;
            if (transaction.authorizedAmount === transaction.amount) continue;
            const key = transaction.merchantName;
            const list = groups.get(key) ?? [];
            list.push(transaction);
            groups.set(key, list);
        }

        return [...groups.entries()]
            .map(([merchantName, list]) => {
                const deltas = list.map((transaction) => transaction.amount - (transaction.authorizedAmount ?? 0));
                const percentages = list.map((transaction) => {
                    const base = transaction.authorizedAmount ?? 0;
                    return base > 0 ? ((transaction.amount - base) / base) * 100 : 0;
                });
                const last = list[list.length - 1];
                return {
                    merchantName,
                    count: list.length,
                    averageDelta: money(deltas.reduce((sum, value) => sum + value, 0) / list.length),
                    averagePercent:
                        Math.round((percentages.reduce((sum, value) => sum + value, 0) / list.length) * 100) / 100,
                    lastDelta: money(last.amount - (last.authorizedAmount ?? 0)),
                    lastAmount: money(last.amount),
                };
            })
            .sort((a, b) => b.count - a.count)
            .slice(0, 20);
    }

    async confirmTransaction(
        userId: string,
        transactionId: string,
        payload: { amount?: number; description?: string }
    ): Promise<TransactionResponse> {
        return await AppDataSourceProd.transaction(async (manager) => {
            const transaction = await manager.findOne(Transaction, {
                where: { id: transactionId, user: { id: userId } },
                relations: ["account", "category", "relatedAccount"],
            });
            if (!transaction) throw new NotFoundError("Transaccion no encontrada");
            if (transaction.type !== TypeTransaction.EXPENSE) {
                throw new BadRequestError("Solo se pueden confirmar gastos");
            }
            if (transaction.account.type !== TypeAccount.CREDIT) {
                throw new BadRequestError("La transaccion no pertenece a una tarjeta de credito");
            }
            if (transaction.creditStatus !== CreditTransactionStatus.PENDING) {
                throw new ConflictError("La transaccion ya fue confirmada");
            }

            const card = await manager.findOne(Account, {
                where: { id: transaction.account.id },
                lock: { mode: "pessimistic_write" },
            });
            if (!card) throw new NotFoundError("Tarjeta no encontrada");

            const nextAmount = payload.amount ?? transaction.amount;
            const delta = nextAmount - transaction.amount;
            card.balance -= delta;
            transaction.amount = nextAmount;
            transaction.creditStatus = CreditTransactionStatus.POSTED;
            transaction.confirmedAt = new Date();
            transaction.postedAt = toYmd(new Date()) as unknown as Date;
            transaction.expectedPostAt = null;
            if (payload.description !== undefined) transaction.description = payload.description;

            await manager.save(card);
            const saved = await manager.save(transaction);

            const cycle = cycleForDate(
                saved.date,
                card.billingCloseDay || 1,
                card.paymentDueDay || 1
            );
            await this.recalculateInsuranceForCycle(manager, card, userId, cycle);

            return toTransactionResponse(saved);
        });
    }

    async confirmAllPending(userId: string, accountId: string): Promise<{ confirmed: number }> {
        await this.getCard(accountId, userId);
        const pending = await this.transactionRepo.find({
            where: {
                account: { id: accountId },
                user: { id: userId },
                creditStatus: CreditTransactionStatus.PENDING,
            },
            order: { date: "ASC", createdAt: "ASC" },
        });

        for (const transaction of pending) {
            await this.confirmTransaction(userId, transaction.id, {});
        }
        return { confirmed: pending.length };
    }

    async previewInstallmentPlan(
        userId: string,
        accountId: string,
        payload: CreateInstallmentPlanSchema
    ): Promise<CreditCardPlanPreviewResponse> {
        const card = await this.getCard(accountId, userId);
        if (!card.billingCloseDay || !card.paymentDueDay) {
            throw new BadRequestError("La tarjeta necesita dia de cierre y dia de pago");
        }

        const ids = [...new Set(payload.transactionIds)];
        const transactions = await this.transactionRepo.find({
            where: {
                id: In(ids),
                account: { id: accountId },
                user: { id: userId },
                type: TypeTransaction.EXPENSE,
            },
        });
        if (transactions.length !== ids.length) {
            throw new NotFoundError("Una o mas compras no existen o no pertenecen a la tarjeta");
        }
        if (transactions.some((transaction) => transaction.creditStatus !== CreditTransactionStatus.POSTED)) {
            throw new ConflictError("Confirma las compras pendientes antes de pasarlas a cuotas");
        }
        if (transactions.some((transaction) => transaction.installmentPlanId)) {
            throw new ConflictError("Alguna compra ya forma parte de un plan de cuotas");
        }

        const summary = await this.getSummary(accountId, userId, { ensureCharges: false });
        const eligibleIds = new Set(summary.eligiblePurchases.map((purchase) => purchase.id));
        if (ids.some((id) => !eligibleIds.has(id))) {
            throw new ConflictError(
                "Solo se pueden pasar a cuotas compras confirmadas y sin pagos aplicados"
            );
        }

        const principal = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
        const tea = payload.tea ?? card.tea ?? 0;
        const firstDueDate = nextDueDate(new Date(), card.billingCloseDay, card.paymentDueDay);
        const schedule = buildInstallmentSchedule({
            principal,
            installmentsCount: payload.installments,
            teaPercent: tea,
            firstDueDate,
            closeDay: card.billingCloseDay,
        });

        return {
            principal: money(principal),
            installmentsCount: payload.installments,
            tea,
            totalInterest: money(schedule.totalInterest),
            totalAmount: money(schedule.totalAmount),
            firstDueDate,
            transactions: transactions.map((transaction) => ({
                id: transaction.id,
                name: transaction.name,
                date: transaction.date,
                amount: money(transaction.amount),
            })),
            installments: schedule.rows.map((row) => ({
                number: row.number,
                dueDate: row.dueDate,
                principal: money(row.principal),
                interest: money(row.interest),
                total: money(row.total),
            })),
        };
    }

    async createInstallmentPlan(
        userId: string,
        accountId: string,
        payload: CreateInstallmentPlanSchema
    ): Promise<CreditCardPlanResponse> {
        const card = await this.getCard(accountId, userId);
        if (!card.billingCloseDay || !card.paymentDueDay) {
            throw new BadRequestError("La tarjeta necesita dia de cierre y dia de pago");
        }

        const ids = [...new Set(payload.transactionIds)];
        const transactions = await this.transactionRepo.find({
            where: {
                id: In(ids),
                account: { id: accountId },
                user: { id: userId },
                type: TypeTransaction.EXPENSE,
            },
        });

        if (transactions.length !== ids.length) {
            throw new NotFoundError("Una o mas compras no existen o no pertenecen a la tarjeta");
        }
        if (transactions.some((transaction) => transaction.creditStatus !== CreditTransactionStatus.POSTED)) {
            throw new ConflictError("Confirma las compras pendientes antes de pasarlas a cuotas");
        }
        if (transactions.some((transaction) => transaction.installmentPlanId)) {
            throw new ConflictError("Alguna compra ya forma parte de un plan de cuotas");
        }

        const summary = await this.getSummary(accountId, userId);
        const eligibleIds = new Set(summary.eligiblePurchases.map((purchase) => purchase.id));
        if (ids.some((id) => !eligibleIds.has(id))) {
            throw new ConflictError(
                "Solo se pueden pasar a cuotas compras confirmadas y sin pagos aplicados"
            );
        }

        const principal = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
        if (principal <= 0) throw new BadRequestError("El monto a financiar debe ser mayor a 0");

        const tea = payload.tea ?? card.tea ?? 0;
        const firstDueDate = nextDueDate(new Date(), card.billingCloseDay, card.paymentDueDay);
        const schedule = buildInstallmentSchedule({
            principal,
            installmentsCount: payload.installments,
            teaPercent: tea,
            firstDueDate,
            closeDay: card.billingCloseDay,
        });

        const plan = await AppDataSourceProd.transaction(async (manager) => {
            const user = await manager.findOne(User, { where: { id: userId } });
            if (!user) throw new NotFoundError("Usuario no encontrado");
            const account = await manager.findOne(Account, {
                where: { id: accountId },
                lock: { mode: "pessimistic_write" },
            });
            if (!account) throw new NotFoundError("Tarjeta no encontrada");

            const created = manager.create(CreditInstallmentPlan, {
                account,
                accountId,
                user,
                userId,
                tea,
                principal,
                installmentsCount: payload.installments,
                firstDueDate,
                totalInterest: schedule.totalInterest,
                totalAmount: schedule.totalAmount,
                status: CreditInstallmentPlanStatus.ACTIVE,
            });
            const savedPlan = await manager.save(created);

            const installments = schedule.rows.map((row) =>
                manager.create(CreditInstallment, {
                    plan: savedPlan,
                    planId: savedPlan.id,
                    number: row.number,
                    closingDate: row.closingDate,
                    dueDate: row.dueDate,
                    principal: row.principal,
                    interest: row.interest,
                    total: row.total,
                    status: CreditInstallmentStatus.PENDING,
                    paidAmount: 0,
                })
            );
            savedPlan.installments = await manager.save(installments);

            await manager
                .createQueryBuilder()
                .update(Transaction)
                .set({ installmentPlanId: savedPlan.id })
                .whereInIds(ids)
                .execute();

            return savedPlan;
        });

        return toPlanResponse(plan);
    }

    async cancelInstallmentPlan(userId: string, accountId: string, planId: string): Promise<void> {
        await this.getCard(accountId, userId);
        const plan = await this.planRepo.findOne({
            where: { id: planId, account: { id: accountId }, user: { id: userId } },
            relations: ["installments"],
        });
        if (!plan) throw new NotFoundError("Plan de cuotas no encontrado");
        if (plan.status !== CreditInstallmentPlanStatus.ACTIVE) {
            throw new ConflictError("El plan ya no esta activo");
        }
        const today = dayjs().startOf("day");
        const hasStarted = (plan.installments ?? []).some(
            (installment) =>
                installment.status !== CreditInstallmentStatus.PENDING ||
                installment.paidAmount > 0 ||
                !dayjs(installment.dueDate).isAfter(today, "day")
        );
        if (hasStarted) {
            throw new ConflictError("Solo se pueden cancelar planes cuyas cuotas aun no han vencido");
        }

        await AppDataSourceProd.transaction(async (manager) => {
            const account = await manager.findOne(Account, {
                where: { id: accountId },
                lock: { mode: "pessimistic_write" },
            });
            if (!account) throw new NotFoundError("Tarjeta no encontrada");

            const installmentIds = (plan.installments ?? []).map((installment) => installment.id);
            if (installmentIds.length > 0) {
                const futureCharges = await manager.find(CreditCardCharge, {
                    where: {
                        installmentId: In(installmentIds),
                        ignored: false,
                    },
                });
                for (const charge of futureCharges) {
                    if (dayjs(charge.dueDate).isAfter(today, "day")) {
                        account.balance += charge.amount;
                        charge.amount = 0;
                        charge.ignored = true;
                        await manager.save(charge);
                    }
                }
                await manager.save(account);
            }

            plan.status = CreditInstallmentPlanStatus.CANCELLED;
            for (const installment of plan.installments ?? []) {
                installment.status = CreditInstallmentStatus.CANCELLED;
                await manager.save(installment);
            }
            await manager.save(plan);
            await manager
                .createQueryBuilder()
                .update(Transaction)
                .set({ installmentPlanId: null })
                .where("installmentPlanId = :planId", { planId })
                .execute();
        });
    }

    async createCharge(
        userId: string,
        accountId: string,
        payload: CreateChargeSchema
    ): Promise<CreditCardChargeResponse> {
        const card = await this.getCard(accountId, userId);
        const dueDate = payload.dueDate ?? cycleForDate(
            new Date(),
            card.billingCloseDay || 1,
            card.paymentDueDay || 1
        ).dueDate;
        const closingDate = closingDateForDueDate(dueDate, card.billingCloseDay || 1);

        const charge = await AppDataSourceProd.transaction(async (manager) => {
            const account = await manager.findOne(Account, {
                where: { id: accountId },
                lock: { mode: "pessimistic_write" },
            });
            if (!account) throw new NotFoundError("Tarjeta no encontrada");
            const created = manager.create(CreditCardCharge, {
                account,
                accountId,
                userId,
                type: payload.type,
                source: CreditChargeSource.MANUAL,
                rate: payload.rate ?? null,
                baseAmount: payload.baseAmount ?? null,
                amount: payload.amount,
                periodKey: closingDate.slice(0, 7),
                closingDate,
                dueDate,
                description: payload.description ?? null,
            });
            account.balance -= payload.amount;
            await manager.save(account);
            return await manager.save(created);
        });

        return toChargeResponse(charge);
    }

    async updateCharge(
        userId: string,
        accountId: string,
        chargeId: string,
        payload: UpdateChargeSchema
    ): Promise<CreditCardChargeResponse> {
        await this.getCard(accountId, userId);
        const charge = await this.chargeRepo.findOne({
            where: { id: chargeId, account: { id: accountId }, user: { id: userId } },
        });
        if (!charge) throw new NotFoundError("Cargo no encontrado");

        if (charge.type === CreditChargeType.INSURANCE && charge.source === CreditChargeSource.AUTO) {
            throw new ConflictError(
                "El seguro de desgravamen es un cargo recurrente fijo. Modifica la tasa del seguro en la tarjeta."
            );
        }

        const updated = await AppDataSourceProd.transaction(async (manager) => {
            const account = await manager.findOne(Account, {
                where: { id: accountId },
                lock: { mode: "pessimistic_write" },
            });
            if (!account) throw new NotFoundError("Tarjeta no encontrada");
            if (payload.amount != null) {
                account.balance -= payload.amount - charge.amount;
                charge.amount = payload.amount;
            }
            if (payload.rate !== undefined) charge.rate = payload.rate;
            if (payload.baseAmount !== undefined) charge.baseAmount = payload.baseAmount;
            if (payload.description !== undefined) charge.description = payload.description;
            if (payload.dueDate) {
                charge.dueDate = payload.dueDate;
                charge.closingDate = closingDateForDueDate(
                    payload.dueDate,
                    (await this.getCard(accountId, userId, manager)).billingCloseDay || 1
                );
                charge.periodKey = charge.closingDate.slice(0, 7);
            }
            if (charge.source === CreditChargeSource.AUTO) {
                charge.source = CreditChargeSource.MANUAL;
            }
            await manager.save(account);
            return await manager.save(charge);
        });

        return toChargeResponse(updated);
    }

    async deleteCharge(userId: string, accountId: string, chargeId: string): Promise<void> {
        await this.getCard(accountId, userId);
        const charge = await this.chargeRepo.findOne({
            where: { id: chargeId, account: { id: accountId }, user: { id: userId } },
        });
        if (!charge) throw new NotFoundError("Cargo no encontrado");

        if (charge.type === CreditChargeType.INSURANCE && charge.source === CreditChargeSource.AUTO) {
            throw new ConflictError(
                "El seguro de desgravamen es un cargo recurrente fijo. Modifica la tasa del seguro en la tarjeta."
            );
        }

        await AppDataSourceProd.transaction(async (manager) => {
            const account = await manager.findOne(Account, {
                where: { id: accountId },
                lock: { mode: "pessimistic_write" },
            });
            if (!account) throw new NotFoundError("Tarjeta no encontrada");
            account.balance += charge.amount;
            if (charge.source === CreditChargeSource.AUTO) {
                charge.ignored = true;
                charge.amount = 0;
                await manager.save(charge);
            } else {
                await manager.remove(charge);
            }
            await manager.save(account);
        });
    }

    async uploadDocument(
        userId: string,
        accountId: string,
        file: UploadedCreditDocument,
        type: CreditDocumentType,
        extractedData?: Record<string, unknown> | null
    ): Promise<CreditCardDocumentResponse> {
        const card = await this.getCard(accountId, userId);
        if (!file.size) throw new BadRequestError("El archivo esta vacio");
        if (file.size > MAX_CREDIT_DOCUMENT_SIZE) {
            throw new BadRequestError(
                `El archivo supera el limite de ${MAX_CREDIT_DOCUMENT_SIZE / (1024 * 1024)} MB`
            );
        }
        if (!isAllowedDocumentType(file.type)) {
            throw new BadRequestError("Tipo de archivo no permitido");
        }

        const safeName = file.name.replace(/[\\/]/g, "_").slice(0, 255) || "contrato";
        const document = this.documentRepo.create({
            account: card,
            accountId: card.id,
            userId,
            fileName: safeName,
            mimeType: file.type,
            size: file.size,
            data: file.data,
            type,
            extractedData: extractedData ?? null,
        });

        return toDocumentResponse(await this.documentRepo.save(document));
    }

    async listDocuments(userId: string, accountId: string): Promise<CreditCardDocumentResponse[]> {
        await this.getCard(accountId, userId);
        const documents = await this.documentRepo.find({
            where: { account: { id: accountId }, user: { id: userId } },
            select: ["id", "fileName", "mimeType", "size", "type", "extractedData", "createdAt"],
            order: { createdAt: "DESC" },
        });
        return documents.map(toDocumentResponse);
    }

    async getDocumentFile(userId: string, accountId: string, documentId: string): Promise<CreditCardDocument> {
        await this.getCard(accountId, userId);
        const document = await this.documentRepo.findOne({
            where: { id: documentId, account: { id: accountId }, user: { id: userId } },
        });
        if (!document) throw new NotFoundError("Documento no encontrado");
        return document;
    }

    async deleteDocument(userId: string, accountId: string, documentId: string): Promise<void> {
        const document = await this.getDocumentFile(userId, accountId, documentId);
        await this.documentRepo.remove(document);
    }
}
