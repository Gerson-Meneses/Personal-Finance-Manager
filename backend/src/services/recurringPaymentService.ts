import dayjs from "dayjs";
import { Between, In, IsNull, LessThanOrEqual } from "typeorm";
import { AppDataSourceProd } from "../database/dataBaseDev";
import { Account } from "../entities/Account.entity";
import { Category } from "../entities/Category.entity";
import { PaymentNotification } from "../entities/PaymentNotification.entity";
import { RecurringPayment } from "../entities/RecurringPayment.entity";
import { RecurringPaymentOccurrence } from "../entities/RecurringPaymentOccurrence.entity";
import { BadRequestError, ConflictError, NotFoundError } from "../helpers/errors/domain.errors";
import { UuidSchema } from "../schemas/uuid.schema";
import type {
    CreateRecurringPaymentOutput,
    ExecuteOccurrenceOutput,
    SkipOccurrenceOutput,
    UpdateRecurringPaymentOutput,
} from "../schemas/recurringPayment.schema";
import {
    RecurrenceFrequency,
    RecurringEntryType,
    RecurringLoanAction,
    RecurringOccurrenceStatus,
    TypeLoan,
    TypeTransaction,
} from "../utils/Enums";
import { money } from "../utils/normalizarMoney";
import { TransactionService } from "./transactionService";
import { CreditCardService } from "./creditCardService";
import type { CreditCardForecastItemResponse } from "../ResponseInterfaces/CreditCardResponse";
import { Contact } from "../entities/Contact.entity";
import { LoansService } from "./loansService";
import type { TransactionSchema } from "../schemas/transaction.schema";

export interface RecurringPaymentResponse {
    id: string;
    name: string;
    description?: string | null;
    type: RecurringEntryType;
    amount: number;
    frequency: RecurrenceFrequency;
    intervalCount: number;
    dayOfMonth?: number | null;
    dayOfWeek?: number | null;
    startDate: string;
    endDate?: string | null;
    maxOccurrences?: number | null;
    isActive: boolean;
    autoDebit: boolean;
    loanAction: RecurringLoanAction;
    loanId?: string | null;
    loanContactId?: string | null;
    loanCounterparty?: string | null;
    loan?: { id: string; lender: string; type: TypeLoan } | null;
    nextDueDate?: string | null;
    account?: { id: string; name: string; color?: string; icon?: string };
    category?: { id: string; name: string; color?: string; icon?: string };
    createdAt: Date;
    updatedAt: Date;
}

export interface RecurringOccurrenceResponse {
    id: string;
    paymentId: string;
    name: string;
    description?: string | null;
    type: RecurringEntryType;
    amount: number;
    dueDate: string;
    status: RecurringOccurrenceStatus;
    autoDebit: boolean;
    plannedAmount: number;
    executedAmount?: number | null;
    executionNote?: string | null;
    loanAction: RecurringLoanAction;
    loanCounterparty?: string | null;
    account?: { id: string; name: string; color?: string; icon?: string } | null;
    category?: { id: string; name: string; color?: string; icon?: string } | null;
    transactionId?: string | null;
    failureReason?: string | null;
    notifiedAt?: Date | null;
    executedAt?: Date | null;
}

export interface RecurringMonthProjection {
    month: string;
    from: string;
    to: string;
    expectedIncome: number;
    expectedExpense: number;
    projectedNet: number;
    paidIncome: number;
    paidExpense: number;
    pendingIncome: number;
    pendingExpense: number;
    dueCount: number;
    occurrences: RecurringOccurrenceResponse[];
    creditCardForecast: CreditCardForecastItemResponse[];
}

export interface PaymentNotificationResponse {
    id: string;
    kind: string;
    title: string;
    message: string;
    readAt?: Date | null;
    createdAt: Date;
    accountId?: string | null;
    occurrence?: {
        id: string;
        dueDate: string;
        amount: number;
        type: RecurringEntryType;
        status: RecurringOccurrenceStatus;
    };
}

const RECURRING_JOB_LOCK_KEY = 715_000_001;

const toYmd = (date: Date | string) => dayjs(date).format("YYYY-MM-DD");
const clampDay = (year: number, monthIndex: number, day: number) =>
    Math.min(day, new Date(year, monthIndex + 1, 0).getDate());

export function daysInRange(payment: RecurringPayment, from: string, to: string): string[] {
    const rangeStart = payment.startDate > from ? payment.startDate : from;
    const rangeEnd = payment.endDate && payment.endDate < to ? payment.endDate : to;
    if (rangeStart > rangeEnd) return [];

    if (payment.frequency === RecurrenceFrequency.ONCE) {
        return payment.startDate >= rangeStart && payment.startDate <= rangeEnd
            ? [payment.startDate]
            : [];
    }

    const maxOccurrences = payment.maxOccurrences && payment.maxOccurrences > 0
        ? payment.maxOccurrences
        : Number.POSITIVE_INFINITY;
    let generated = 0;
    const dates: string[] = [];

    if (payment.frequency === RecurrenceFrequency.WEEKLY || payment.frequency === RecurrenceFrequency.BIWEEKLY) {
        const start = dayjs(payment.startDate);
        const dayOfWeek = payment.dayOfWeek ?? start.day();
        const first = start.add((dayOfWeek - start.day() + 7) % 7, "day");
        const stepWeeks = payment.frequency === RecurrenceFrequency.BIWEEKLY ? 2 : 1;
        const step = stepWeeks * Math.max(1, payment.intervalCount);

        let cursor = first;
        while (cursor.format("YYYY-MM-DD") <= rangeEnd) {
            const due = cursor.format("YYYY-MM-DD");
            if (due >= payment.startDate) {
                generated += 1;
                if (generated > maxOccurrences) break;
                if (due >= rangeStart) dates.push(due);
            }
            cursor = cursor.add(step, "week");
        }
        return dates;
    }

    if (payment.frequency === RecurrenceFrequency.FIFTEEN_DAYS) {
        const start = dayjs(payment.startDate);
        const stepDays = 15 * Math.max(1, payment.intervalCount);
        let cursor = start;

        while (cursor.format("YYYY-MM-DD") <= rangeEnd) {
            const due = cursor.format("YYYY-MM-DD");
            if (due >= payment.startDate) {
                generated += 1;
                if (generated > maxOccurrences) break;
                if (due >= rangeStart) dates.push(due);
            }
            cursor = cursor.add(stepDays, "day");
        }
        return dates;
    }

    if (payment.frequency === RecurrenceFrequency.YEARLY) {
        const start = dayjs(payment.startDate);
        const day = payment.dayOfMonth ?? start.date();
        const monthIndex = start.month();
        let year = start.year();
        const endYear = dayjs(rangeEnd).year();

        while (year <= endYear) {
            const due = dayjs(new Date(year, monthIndex, 1))
                .date(clampDay(year, monthIndex, day))
                .format("YYYY-MM-DD");
            if (due >= payment.startDate) {
                generated += 1;
                if (generated > maxOccurrences) break;
                if (due >= rangeStart && due <= rangeEnd) dates.push(due);
            }
            year += Math.max(1, payment.intervalCount);
        }
        return dates;
    }

    // MONTHLY (también es el fallback)
    const start = dayjs(payment.startDate);
    const day = payment.dayOfMonth ?? start.date();
    let cursor = start.startOf("month");
    let monthStep = 0;
    const end = dayjs(rangeEnd).startOf("month");

    while (cursor.isBefore(end, "month") || cursor.isSame(end, "month")) {
        if (monthStep % Math.max(1, payment.intervalCount) === 0) {
            const due = cursor.date(clampDay(cursor.year(), cursor.month(), day)).format("YYYY-MM-DD");
            if (due >= payment.startDate) {
                generated += 1;
                if (generated > maxOccurrences) break;
                if (due >= rangeStart && due <= rangeEnd) dates.push(due);
            }
        }
        cursor = cursor.add(1, "month");
        monthStep += 1;
    }
    return dates;
}

export class RecurringPaymentService {
    private paymentRepo = AppDataSourceProd.getRepository(RecurringPayment);
    private occurrenceRepo = AppDataSourceProd.getRepository(RecurringPaymentOccurrence);
    private notificationRepo = AppDataSourceProd.getRepository(PaymentNotification);
    private transactionService = new TransactionService();
    private loansService = new LoansService();
    private creditCardService = new CreditCardService();

    private mapPayment(payment: RecurringPayment): RecurringPaymentResponse {
        const nextDates = payment.isActive
            ? daysInRange(payment, toYmd(new Date()), dayjs().add(2, "year").format("YYYY-MM-DD"))
            : [];

        return {
            id: payment.id,
            name: payment.name,
            description: payment.description,
            type: payment.type,
            amount: money(payment.amount),
            frequency: payment.frequency,
            intervalCount: payment.intervalCount,
            dayOfMonth: payment.dayOfMonth,
            dayOfWeek: payment.dayOfWeek,
            startDate: payment.startDate,
            endDate: payment.endDate,
            maxOccurrences: payment.maxOccurrences ?? null,
            isActive: payment.isActive,
            autoDebit: payment.autoDebit,
            loanAction: payment.loanAction ?? RecurringLoanAction.NONE,
            loanId: payment.loanId ?? null,
            loanContactId: payment.loanContactId ?? null,
            loanCounterparty: payment.loanCounterparty ?? null,
            loan: payment.loan
                ? { id: payment.loan.id, lender: payment.loan.lender, type: payment.loan.type }
                : null,
            nextDueDate: nextDates[0] ?? null,
            account: payment.account
                ? {
                    id: payment.account.id,
                    name: payment.account.name,
                    color: payment.account.color,
                    icon: payment.account.icon,
                }
                : undefined,
            category: payment.category
                ? {
                    id: payment.category.id,
                    name: payment.category.name,
                    color: payment.category.color,
                    icon: payment.category.icon,
                }
                : undefined,
            createdAt: payment.createdAt,
            updatedAt: payment.updatedAt,
        };
    }

    private mapOccurrence(occurrence: RecurringPaymentOccurrence): RecurringOccurrenceResponse {
        return {
            id: occurrence.id,
            paymentId: occurrence.paymentId,
            name: occurrence.payment?.name ?? "Pago previsto",
            description: occurrence.payment?.description ?? null,
            type: occurrence.type,
            amount: money(occurrence.amount),
            plannedAmount: money(occurrence.amount),
            executedAmount: occurrence.executedAmount != null ? money(occurrence.executedAmount) : null,
            executionNote: occurrence.executionNote ?? null,
            dueDate: occurrence.dueDate,
            status: occurrence.status,
            autoDebit: occurrence.autoDebit,
            loanAction: occurrence.payment?.loanAction ?? RecurringLoanAction.NONE,
            loanCounterparty: occurrence.payment?.loanCounterparty ?? null,
            account: occurrence.account
                ? {
                    id: occurrence.account.id,
                    name: occurrence.account.name,
                    color: occurrence.account.color,
                    icon: occurrence.account.icon,
                }
                : occurrence.payment?.account
                    ? {
                        id: occurrence.payment.account.id,
                        name: occurrence.payment.account.name,
                        color: occurrence.payment.account.color,
                        icon: occurrence.payment.account.icon,
                    }
                    : null,
            category: occurrence.payment?.category
                ? {
                    id: occurrence.payment.category.id,
                    name: occurrence.payment.category.name,
                    color: occurrence.payment.category.color,
                    icon: occurrence.payment.category.icon,
                }
                : null,
            transactionId: occurrence.transactionId,
            failureReason: occurrence.failureReason,
            notifiedAt: occurrence.notifiedAt,
            executedAt: occurrence.executedAt,
        };
    }

    private async assertAccountAndCategory(
        userId: UuidSchema,
        accountId: string,
        categoryId: string,
        type: RecurringEntryType
    ) {
        const [account, category] = await Promise.all([
            AppDataSourceProd.getRepository(Account).findOne({
                where: { id: accountId, user: { id: userId } },
            }),
            AppDataSourceProd.getRepository(Category).findOne({
                where: { id: categoryId, user: { id: userId } },
            }),
        ]);

        if (!account) throw new NotFoundError("La cuenta no existe o no pertenece al usuario");
        if (!category) throw new NotFoundError("La categoría no existe o no pertenece al usuario");
        if (String(category.type) !== String(type)) {
            throw new ConflictError("El tipo de la categoría no coincide con el movimiento previsto", {
                categoryId: ["Selecciona una categoría del mismo tipo"],
            });
        }
        return { account, category };
    }

    async createPayment(userId: UuidSchema, data: CreateRecurringPaymentOutput): Promise<RecurringPaymentResponse> {
        await this.assertAccountAndCategory(userId, data.accountId, data.categoryId, data.type);

        const payment = this.paymentRepo.create({
            name: data.name,
            description: data.description ?? null,
            type: data.type,
            amount: data.amount,
            frequency: data.frequency,
            intervalCount: data.intervalCount,
            dayOfMonth: data.dayOfMonth ?? null,
            dayOfWeek: data.dayOfWeek ?? null,
            startDate: data.startDate,
            endDate: data.endDate ?? null,
            maxOccurrences: data.maxOccurrences ?? null,
            autoDebit: data.autoDebit,
            loanAction: data.loanAction,
            loanId: data.loanId ?? null,
            loanContactId: data.loanContactId ?? null,
            loanCounterparty: data.loanCounterparty ?? null,
            accountId: data.accountId,
            categoryId: data.categoryId,
            userId,
            isActive: true,
        });

        const saved = await this.paymentRepo.save(payment);
        const month = dayjs().format("YYYY-MM");
        await this.materializeMonth(userId, month);

        return this.mapPayment(
            await this.paymentRepo.findOneOrFail({
                where: { id: saved.id, user: { id: userId } },
                relations: ["account", "category"],
            })
        );
    }

    async updatePayment(
        userId: UuidSchema,
        paymentId: UuidSchema,
        data: UpdateRecurringPaymentOutput
    ): Promise<RecurringPaymentResponse> {
        const payment = await this.paymentRepo.findOne({
            where: { id: paymentId, user: { id: userId } },
            relations: ["account", "category"],
        });
        if (!payment) throw new NotFoundError("Pago previsto no encontrado");

        const nextAccountId = data.accountId ?? payment.accountId;
        const nextCategoryId = data.categoryId ?? payment.categoryId;
        const nextType = data.type ?? payment.type;
        await this.assertAccountAndCategory(userId, nextAccountId, nextCategoryId, nextType);

        Object.assign(payment, {
            ...data,
            description: data.description === undefined ? payment.description : data.description,
            endDate: data.endDate === undefined ? payment.endDate : data.endDate,
            dayOfMonth: data.dayOfMonth === undefined ? payment.dayOfMonth : data.dayOfMonth,
            dayOfWeek: data.dayOfWeek === undefined ? payment.dayOfWeek : data.dayOfWeek,
        });

        await this.paymentRepo.save(payment);

        // Las ocurrencias futuras aún no pagadas se recalculan con la nueva regla.
        const today = toYmd(new Date());
        await this.occurrenceRepo
            .createQueryBuilder()
            .delete()
            .where("paymentId = :paymentId", { paymentId })
            .andWhere("userId = :userId", { userId })
            .andWhere("dueDate >= :today", { today })
            .andWhere("status = :status", { status: RecurringOccurrenceStatus.PENDING })
            .execute();

        await this.materializeMonth(userId, dayjs().format("YYYY-MM"));

        return this.mapPayment(
            await this.paymentRepo.findOneOrFail({
                where: { id: paymentId, user: { id: userId } },
                relations: ["account", "category"],
            })
        );
    }

    async deletePayment(userId: UuidSchema, paymentId: UuidSchema): Promise<void> {
        const payment = await this.paymentRepo.findOne({
            where: { id: paymentId, user: { id: userId } },
        });
        if (!payment) throw new NotFoundError("Pago previsto no encontrado");
        await this.paymentRepo.remove(payment);
    }

    async listPayments(userId: UuidSchema): Promise<RecurringPaymentResponse[]> {
        const payments = await this.paymentRepo.find({
            where: { user: { id: userId } },
            relations: ["account", "category", "loan"],
            order: { createdAt: "DESC" },
        });
        return payments.map((payment) => this.mapPayment(payment));
    }

    async materializeMonth(userId: UuidSchema | undefined, month: string): Promise<void> {
        const from = dayjs(`${month}-01`).startOf("month").format("YYYY-MM-DD");
        const to = dayjs(`${month}-01`).endOf("month").format("YYYY-MM-DD");

        const where = userId ? { user: { id: userId }, isActive: true } : { isActive: true };
        const payments = await this.paymentRepo.find({ where, relations: ["account", "category"] });

        const rows: Partial<RecurringPaymentOccurrence>[] = [];
        for (const payment of payments) {
            if (payment.endDate && payment.endDate < from) continue;
            if (payment.startDate > to) continue;

            for (const dueDate of daysInRange(payment, from, to)) {
                rows.push({
                    paymentId: payment.id,
                    userId: payment.userId,
                    dueDate,
                    amount: payment.amount,
                    type: payment.type,
                    status: RecurringOccurrenceStatus.PENDING,
                    accountId: payment.accountId,
                    autoDebit: payment.autoDebit,
                });
            }
        }

        if (rows.length) {
            await this.occurrenceRepo
                .createQueryBuilder()
                .insert()
                .into(RecurringPaymentOccurrence)
                .values(rows as any)
                .orIgnore()
                .execute();
        }

        await this.refreshDueStatusAndNotifications(userId);
    }

    async refreshDueStatusAndNotifications(userId?: UuidSchema): Promise<void> {
        const today = toYmd(new Date());

        await this.occurrenceRepo
            .createQueryBuilder()
            .update(RecurringPaymentOccurrence)
            .set({ status: RecurringOccurrenceStatus.DUE })
            .where("status = :status", { status: RecurringOccurrenceStatus.PENDING })
            .andWhere("dueDate <= :today", { today })
            .andWhere(userId ? "userId = :userId" : "1=1", userId ? { userId } : {})
            .execute();

        const unnotified = await this.occurrenceRepo.find({
            where: {
                ...(userId ? { userId } : {}),
                status: In([RecurringOccurrenceStatus.PENDING, RecurringOccurrenceStatus.DUE]),
                dueDate: LessThanOrEqual(today),
                notifiedAt: IsNull(),
            },
            relations: ["payment"],
            order: { dueDate: "ASC" },
            take: 200,
        });

        for (const occurrence of unnotified) {
            await this.ensureNotification(occurrence);
            occurrence.notifiedAt = new Date();
            await this.occurrenceRepo.save(occurrence);
        }
    }

    private async ensureNotification(occurrence: RecurringPaymentOccurrence): Promise<void> {
        const existing = await this.notificationRepo.findOneBy({ occurrenceId: occurrence.id });
        if (existing) return;

        const isIncome = occurrence.type === RecurringEntryType.INCOME;
        const title = isIncome ? "Ingreso previsto disponible" : "Pago previsto pendiente";
        const message = isIncome
            ? `${occurrence.payment?.name ?? "Ingreso"} por ${money(occurrence.amount).toFixed(2)} está programado para hoy.`
            : `${occurrence.payment?.name ?? "Pago"} por ${money(occurrence.amount).toFixed(2)} vence hoy. Puedes confirmarlo o dejarlo al débito automático.`;

        await this.notificationRepo
            .createQueryBuilder()
            .insert()
            .into(PaymentNotification)
            .values({
                occurrenceId: occurrence.id,
                userId: occurrence.userId,
                kind: "PAYMENT",
                title,
                message,
            })
            .orIgnore()
            .execute();
    }

    async executeOccurrence(
        userId: UuidSchema,
        occurrenceId: UuidSchema,
        data: ExecuteOccurrenceOutput = {}
    ): Promise<RecurringOccurrenceResponse> {
        const queryRunner = AppDataSourceProd.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const manager = queryRunner.manager;
            const occurrence = await manager
                .createQueryBuilder(RecurringPaymentOccurrence, "occurrence")
                .setLock("pessimistic_write")
                .where("occurrence.id = :occurrenceId", { occurrenceId })
                .andWhere("occurrence.userId = :userId", { userId })
                .getOne();

            if (!occurrence) throw new NotFoundError("Pago previsto no encontrado");
            if (occurrence.status === RecurringOccurrenceStatus.PAID) {
                throw new ConflictError("Este pago ya fue ejecutado");
            }
            if (occurrence.status === RecurringOccurrenceStatus.SKIPPED) {
                throw new ConflictError("Este pago fue omitido");
            }

            const payment = await manager.findOne(RecurringPayment, {
                where: { id: occurrence.paymentId, user: { id: userId } },
                relations: ["account", "category", "loan"],
            });
            if (!payment) throw new NotFoundError("Regla de pago no encontrada");

            const accountId = data.accountId ?? occurrence.accountId ?? payment.accountId;
            const account = await manager.findOne(Account, {
                where: { id: accountId, user: { id: userId } },
            });
            if (!account) throw new NotFoundError("Cuenta de ejecución no encontrada");

            const action = payment.loanAction ?? RecurringLoanAction.NONE;
            const actualAmount = data.amount ?? occurrence.amount;
            const movementNote = data.note ?? data.description ?? payment.description ?? undefined;
            let transactionId: string | null = null;

            if (action === RecurringLoanAction.PAY_LOAN) {
                if (payment.loanContactId || payment.loanCounterparty) {
                    const contact = payment.loanContactId
                        ? await manager.findOne(Contact, {
                              where: { id: payment.loanContactId, userId },
                          })
                        : null;
                    const lender = contact?.name ?? payment.loanCounterparty;
                    if (!lender) {
                        throw new ConflictError("El pago no tiene un contacto válido");
                    }
                    const result = await this.loansService.payLenderDebt(
                        userId,
                        {
                            lender,
                            type: payment.type === RecurringEntryType.INCOME
                                ? TypeLoan.GIVEN
                                : TypeLoan.RECEIVED,
                            amount: actualAmount,
                            date: data.date ?? occurrence.dueDate,
                            time: data.time,
                            description: movementNote,
                            accountId,
                        },
                        manager
                    );
                    transactionId = result.payments[0]?.transaction?.id ?? null;
                } else if (payment.loanId) {
                    const result = await this.loansService.payLoan(
                        userId,
                        payment.loanId as UuidSchema,
                        {
                            amount: actualAmount,
                            date: data.date ?? occurrence.dueDate,
                            time: data.time,
                            description: movementNote,
                            accountId,
                        },
                        manager
                    );
                    transactionId = result.transaction?.id ?? null;
                } else {
                    throw new ConflictError("El pago no tiene una persona o préstamo vinculado");
                }
            } else if (action === RecurringLoanAction.ADVANCE_LOAN) {
                if (!payment.loanId) {
                    throw new ConflictError("El cargo no tiene un préstamo vinculado");
                }

                const result = await this.loansService.addAdvanceToLoan(
                    userId,
                    payment.loanId as UuidSchema,
                    {
                        amount: actualAmount,
                        date: data.date ?? occurrence.dueDate,
                        time: data.time,
                        description: movementNote,
                        accountId,
                    },
                    manager
                );
                transactionId = result.transactionId;
            } else if (
                action === RecurringLoanAction.GIVE_LOAN ||
                action === RecurringLoanAction.RECEIVE_LOAN
            ) {
                const contact = payment.loanContactId
                    ? await manager.findOne(Contact, {
                          where: { id: payment.loanContactId, userId },
                      })
                    : null;
                const lender = contact?.name ?? payment.loanCounterparty;
                if (!lender) {
                    throw new ConflictError("El pago no tiene una persona vinculada");
                }

                const result = await this.loansService.createLoan(
                    userId,
                    {
                        type:
                            action === RecurringLoanAction.GIVE_LOAN
                                ? TypeLoan.GIVEN
                                : TypeLoan.RECEIVED,
                        contactId: contact?.id,
                        lender,
                        amount: actualAmount,
                        startDate: data.date ?? occurrence.dueDate,
                        date: dayjs(data.date ?? occurrence.dueDate).toDate(),
                        time: data.time,
                        description: movementNote,
                        accountId,
                    },
                    manager
                );
                transactionId = result.transaction?.id ?? null;
            } else {
                const transactionData = {
                    name: payment.name,
                    type: payment.type === RecurringEntryType.INCOME
                        ? TypeTransaction.INCOME
                        : TypeTransaction.EXPENSE,
                    amount: actualAmount,
                    date: data.date ?? occurrence.dueDate,
                    time: data.time,
                    description: movementNote,
                    categoryId: payment.categoryId,
                    accountId,
                    isRecurrent: false,
                } as TransactionSchema;

                const transaction = await this.transactionService.createTransaction(
                    transactionData,
                    userId,
                    true,
                    manager
                );
                transactionId = transaction.id;
            }

            if (!transactionId) {
                throw new ConflictError("No se pudo registrar la transacción del préstamo");
            }

            occurrence.status = RecurringOccurrenceStatus.PAID;
            occurrence.transactionId = transactionId;
            occurrence.executedAt = new Date();
            occurrence.executedAmount = actualAmount;
            occurrence.executionNote = data.note ?? null;
            occurrence.accountId = accountId;
            occurrence.failureReason = null;
            await manager.save(occurrence);
            await queryRunner.commitTransaction();

            return this.mapOccurrence(
                await this.occurrenceRepo.findOneOrFail({
                    where: { id: occurrenceId, user: { id: userId } },
                    relations: ["payment", "payment.account", "payment.category", "account"],
                })
            );
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async skipOccurrence(
        userId: UuidSchema,
        occurrenceId: UuidSchema,
        data: SkipOccurrenceOutput = {}
    ): Promise<RecurringOccurrenceResponse> {
        const occurrence = await this.occurrenceRepo.findOne({
            where: { id: occurrenceId, user: { id: userId } },
            relations: ["payment", "payment.account", "payment.category", "account"],
        });
        if (!occurrence) throw new NotFoundError("Pago previsto no encontrado");
        if (occurrence.status === RecurringOccurrenceStatus.PAID) {
            throw new ConflictError("Este pago ya fue ejecutado");
        }

        occurrence.status = RecurringOccurrenceStatus.SKIPPED;
        occurrence.failureReason = data.reason ?? "Omitido por el usuario";
        await this.occurrenceRepo.save(occurrence);
        return this.mapOccurrence(occurrence);
    }

    async processDuePayments(userId?: UuidSchema): Promise<{ processed: number; failed: number }> {
        await this.refreshDueStatusAndNotifications(userId);

        const today = toYmd(new Date());
        const dueAuto = await this.occurrenceRepo
            .createQueryBuilder("occurrence")
            .innerJoin("occurrence.payment", "payment")
            .where("occurrence.autoDebit = true")
            .andWhere("payment.autoDebit = true")
            .andWhere("payment.isActive = true")
            .andWhere("occurrence.status IN (:...statuses)", {
                statuses: [RecurringOccurrenceStatus.DUE, RecurringOccurrenceStatus.PENDING],
            })
            .andWhere("occurrence.dueDate <= :today", { today })
            .andWhere(userId ? "occurrence.userId = :userId" : "1=1", userId ? { userId } : {})
            .orderBy("occurrence.dueDate", "ASC")
            .take(100)
            .getMany();

        let processed = 0;
        let failed = 0;
        for (const occurrence of dueAuto) {
            try {
                await this.executeOccurrence(occurrence.userId, occurrence.id);
                processed += 1;
            } catch (error) {
                failed += 1;
                await this.occurrenceRepo
                    .createQueryBuilder()
                    .update(RecurringPaymentOccurrence)
                    .set({
                        status: RecurringOccurrenceStatus.FAILED,
                        failureReason:
                            error instanceof Error ? error.message : "Error al ejecutar el débito automático",
                    })
                    .where("id = :id", { id: occurrence.id })
                    .andWhere("status IN (:...claimable)", {
                        claimable: [RecurringOccurrenceStatus.PENDING, RecurringOccurrenceStatus.DUE],
                    })
                    .execute();
            }
        }

        return { processed, failed };
    }

    async processAllDuePayments(): Promise<{ processed: number; failed: number }> {
        const lockRunner = AppDataSourceProd.createQueryRunner();
        await lockRunner.connect();

        try {
            const lockRows = (await lockRunner.query(
                "SELECT pg_try_advisory_lock($1) AS locked",
                [RECURRING_JOB_LOCK_KEY]
            )) as { locked: boolean }[];
            if (!lockRows[0]?.locked) return { processed: 0, failed: 0 };

            try {
                // Materializa el mes actual y el anterior para no perder vencimientos
                // si el servidor estuvo detenido.
                await this.materializeMonth(undefined, dayjs().format("YYYY-MM"));
                await this.materializeMonth(undefined, dayjs().subtract(1, "month").format("YYYY-MM"));
                return await this.processDuePayments();
            } finally {
                await lockRunner.query("SELECT pg_advisory_unlock($1)", [RECURRING_JOB_LOCK_KEY]);
            }
        } finally {
            await lockRunner.release();
        }
    }

    async getMonthProjection(userId: UuidSchema, month?: string): Promise<RecurringMonthProjection> {
        const targetMonth = month ?? dayjs().format("YYYY-MM");
        await this.materializeMonth(userId, targetMonth);

        const from = dayjs(`${targetMonth}-01`).startOf("month").format("YYYY-MM-DD");
        const to = dayjs(`${targetMonth}-01`).endOf("month").format("YYYY-MM-DD");

        const occurrences = await this.occurrenceRepo.find({
            where: { userId, dueDate: Between(from, to) },
            relations: ["payment", "payment.account", "payment.category", "account"],
            order: { dueDate: "ASC" },
        });

        const monthOccurrences = occurrences;

        const active = monthOccurrences.filter(
            (occ) => occ.status !== RecurringOccurrenceStatus.SKIPPED && occ.status !== RecurringOccurrenceStatus.FAILED
        );

        const sumCents = (list: RecurringPaymentOccurrence[]) =>
            list.reduce(
                (total, occ) =>
                    total +
                    (occ.status === RecurringOccurrenceStatus.PAID
                        ? occ.executedAmount ?? occ.amount
                        : occ.amount),
                0
            );

        const income = active.filter((occ) => occ.type === RecurringEntryType.INCOME);
        const expense = active.filter((occ) => occ.type === RecurringEntryType.EXPENSE);
        const paid = active.filter((occ) => occ.status === RecurringOccurrenceStatus.PAID);
        const creditCardForecast = await this.creditCardService.getForecast(userId, from, to);
        const today = dayjs().format("YYYY-MM-DD");
        const forecastExpenseCents = creditCardForecast.reduce(
            (total, item) => total + Math.round(item.amount * 100),
            0
        );

        return {
            month: targetMonth,
            from,
            to,
            expectedIncome: money(sumCents(income)),
            expectedExpense: money(sumCents(expense) + forecastExpenseCents),
            projectedNet: money(sumCents(income) - sumCents(expense) - forecastExpenseCents),
            paidIncome: money(sumCents(paid.filter((occ) => occ.type === RecurringEntryType.INCOME))),
            paidExpense: money(sumCents(paid.filter((occ) => occ.type === RecurringEntryType.EXPENSE))),
            pendingIncome: money(sumCents(income.filter((occ) => occ.status !== RecurringOccurrenceStatus.PAID))),
            pendingExpense: money(
                sumCents(expense.filter((occ) => occ.status !== RecurringOccurrenceStatus.PAID)) +
                forecastExpenseCents
            ),
            dueCount:
                monthOccurrences.filter((occ) => occ.status === RecurringOccurrenceStatus.DUE).length +
                creditCardForecast.filter((item) => item.dueDate === today).length,
            occurrences: monthOccurrences.map((occ) => this.mapOccurrence(occ)),
            creditCardForecast,
        };
    }

    async getNotifications(userId: UuidSchema, unreadOnly = false): Promise<PaymentNotificationResponse[]> {
        const notifications = await this.notificationRepo.find({
            where: {
                userId,
                ...(unreadOnly ? { readAt: IsNull() } : {}),
            },
            relations: ["occurrence"],
            order: { createdAt: "DESC" },
            take: 100,
        });

        return notifications.map((notification) => ({
            id: notification.id,
            kind: notification.kind ?? "PAYMENT",
            title: notification.title,
            message: notification.message,
            readAt: notification.readAt,
            createdAt: notification.createdAt,
            accountId: notification.accountId ?? null,
            occurrence: notification.occurrence
                ? {
                    id: notification.occurrence.id,
                    dueDate: notification.occurrence.dueDate,
                    amount: money(notification.occurrence.amount),
                    type: notification.occurrence.type,
                    status: notification.occurrence.status,
                }
                : undefined,
        }));
    }

    async markNotificationRead(userId: UuidSchema, notificationId: UuidSchema): Promise<void> {
        const result = await this.notificationRepo.update(
            { id: notificationId, userId },
            { readAt: new Date() }
        );
        if (!result.affected) throw new NotFoundError("Notificación no encontrada");
    }

    async markAllNotificationsRead(userId: UuidSchema): Promise<void> {
        await this.notificationRepo.update({ userId, readAt: IsNull() }, { readAt: new Date() });
    }
}
