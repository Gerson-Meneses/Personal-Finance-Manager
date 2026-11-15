import dayjs, { type Dayjs } from "dayjs";
import { In } from "typeorm";
import { AppDataSourceProd } from "../database/dataBaseDev";
import { Account } from "../entities/Account.entity";
import { Category } from "../entities/Category.entity";
import { Contact } from "../entities/Contact.entity";
import { Loan } from "../entities/Loan.entity";
import { LoanPlan } from "../entities/LoanPlan.entity";
import { RecurringPayment } from "../entities/RecurringPayment.entity";
import { RecurringSuggestionDismissal } from "../entities/RecurringSuggestionDismissal.entity";
import { Transaction } from "../entities/Transaction.entity";
import { calculateLoanPaymentStatus } from "../mappers/LoansMapper";
import { UuidSchema } from "../schemas/uuid.schema";
import {
    LoanMovementType,
    LoanPlanStatus,
    RecurrenceFrequency,
    RecurringEntryType,
    RecurringLoanAction,
    StatusLoan,
    TransactionReportingImpact,
    TypeLoan,
    TypeTransaction,
} from "../utils/Enums";
import { money } from "../utils/normalizarMoney";

export type RecurringSuggestionKind = "TRANSACTION" | "LOAN";

export interface RecurringSuggestion {
    id: string;
    kind: RecurringSuggestionKind;
    name: string;
    description?: string | null;
    type: RecurringEntryType;
    amount: number;
    frequency: RecurrenceFrequency;
    intervalCount: number;
    dayOfMonth: number | null;
    dayOfWeek: number | null;
    startDate: string;
    maxOccurrences: number | null;
    accountId: string;
    categoryId: string;
    loanAction: RecurringLoanAction;
    loanId: string | null;
    loanContactId: string | null;
    loanCounterparty: string | null;
    confidence: number;
    sampleCount: number;
    lastDate: string | null;
    reason: string;
    account?: { id: string; name: string; color?: string; icon?: string };
    category?: { id: string; name: string; color?: string; icon?: string };
    contact?: { id: string; name: string };
}

export interface RecurringSuggestionsResponse {
    generatedAt: string;
    lookbackDays: number;
    suggestions: RecurringSuggestion[];
}

export interface RecurrencePattern {
    frequency: RecurrenceFrequency;
    intervalCount: number;
    dayOfMonth: number | null;
    dayOfWeek: number | null;
    nextDate: string;
    confidence: number;
    amountVariation: number;
}

const LOOKBACK_DAYS = 180;
const MIN_OCCURRENCES = 3;
const MAX_SUGGESTIONS = 12;

const LOAN_CATEGORY_NAMES = new Set([
    "PRESTAMO",
    "PRESTAMOS",
    "DEVOLUCION DE PRESTAMO",
    "DEVOLUCION DE PRESTAMOS",
    "PAGO DE PRESTAMO",
    "PAGO DE PRESTAMOS",
    "COBRO DE PRESTAMO",
    "COBRO DE PRESTAMOS",
]);

const normalizeName = (value: string) =>
    value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

const normalizeCategoryName = (value: string) =>
    value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toUpperCase();

const median = (values: number[]): number => {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
};

const mode = (values: number[]): number | null => {
    if (values.length === 0) return null;
    const counts = new Map<number, number>();
    for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
};

const intervalInDays = (from: string, to: string) => dayjs(to).diff(dayjs(from), "day");

interface FrequencyInfo {
    frequency: RecurrenceFrequency;
    intervalCount: number;
}

export function frequencyFromInterval(intervalDays: number): FrequencyInfo | null {
    if (intervalDays >= 5 && intervalDays <= 9) {
        return { frequency: RecurrenceFrequency.WEEKLY, intervalCount: 1 };
    }
    if (intervalDays >= 12 && intervalDays <= 16) {
        return {
            frequency: intervalDays >= 15 ? RecurrenceFrequency.FIFTEEN_DAYS : RecurrenceFrequency.BIWEEKLY,
            intervalCount: 1,
        };
    }
    if (intervalDays >= 25 && intervalDays <= 35) {
        return { frequency: RecurrenceFrequency.MONTHLY, intervalCount: 1 };
    }
    if (intervalDays >= 50 && intervalDays <= 70) {
        return { frequency: RecurrenceFrequency.MONTHLY, intervalCount: 2 };
    }
    if (intervalDays >= 80 && intervalDays <= 100) {
        return { frequency: RecurrenceFrequency.MONTHLY, intervalCount: 3 };
    }
    if (intervalDays >= 340 && intervalDays <= 390) {
        return { frequency: RecurrenceFrequency.YEARLY, intervalCount: 1 };
    }
    return null;
}

const expectedDaysFor = ({ frequency, intervalCount }: FrequencyInfo): number => {
    const days =
        frequency === RecurrenceFrequency.WEEKLY
            ? 7
            : frequency === RecurrenceFrequency.BIWEEKLY
                ? 14
                : frequency === RecurrenceFrequency.FIFTEEN_DAYS
                    ? 15
                    : frequency === RecurrenceFrequency.YEARLY
                        ? 365
                        : 30;
    return Math.max(1, intervalCount) * days;
};

const incrementDate = (
    from: Dayjs,
    info: FrequencyInfo,
    dayOfMonth: number | null
): Dayjs => {
    if (info.frequency === RecurrenceFrequency.WEEKLY) {
        return from.add(7 * info.intervalCount, "day");
    }
    if (info.frequency === RecurrenceFrequency.BIWEEKLY) {
        return from.add(14 * info.intervalCount, "day");
    }
    if (info.frequency === RecurrenceFrequency.FIFTEEN_DAYS) {
        return from.add(15 * info.intervalCount, "day");
    }
    if (info.frequency === RecurrenceFrequency.YEARLY) {
        const next = from.add(info.intervalCount, "year");
        const day = Math.min(dayOfMonth ?? next.date(), next.daysInMonth());
        return next.date(day);
    }
    const next = from.add(info.intervalCount, "month");
    const day = Math.min(dayOfMonth ?? next.date(), next.daysInMonth());
    return next.date(day);
};

const nextDateAfter = (
    lastDate: Dayjs,
    today: Dayjs,
    info: FrequencyInfo,
    dayOfMonth: number | null
): string => {
    let cursor = incrementDate(lastDate, info, dayOfMonth);
    let guard = 0;
    while (!cursor.isAfter(today, "day") && guard < 120) {
        cursor = incrementDate(cursor, info, dayOfMonth);
        guard += 1;
    }
    return cursor.format("YYYY-MM-DD");
};

export function detectRecurrence(
    rawDates: string[],
    rawAmounts: number[],
    referenceDate: Dayjs | string = dayjs()
): RecurrencePattern | null {
    const dates = [...new Set(rawDates.filter(Boolean))].sort();
    if (dates.length < MIN_OCCURRENCES) return null;

    const intervals = dates
        .slice(1)
        .map((date, index) => intervalInDays(dates[index], date))
        .filter((value) => value > 0);
    if (intervals.length < MIN_OCCURRENCES - 1) return null;

    const info = frequencyFromInterval(median(intervals));
    if (!info) return null;

    const expectedDays = expectedDaysFor(info);
    const tolerance = Math.max(3, expectedDays * 0.35);
    const consistent = intervals.filter((value) => Math.abs(value - expectedDays) <= tolerance).length;
    const consistency = consistent / intervals.length;
    if (consistency < 0.6) return null;

    const first = dayjs(dates[0]).startOf("day");
    const last = dayjs(dates[dates.length - 1]).startOf("day");
    const today = (dayjs.isDayjs(referenceDate) ? referenceDate : dayjs(referenceDate)).startOf("day");
    const span = last.diff(first, "day");
    if (span < expectedDays * 1.5) return null;

    const grace = info.frequency === RecurrenceFrequency.YEARLY ? 420 : Math.max(35, expectedDays * 2.2);
    if (last.isBefore(today.subtract(grace, "day"))) return null;

    const dayOfMonth =
        info.frequency === RecurrenceFrequency.MONTHLY || info.frequency === RecurrenceFrequency.YEARLY
            ? mode(dates.map((date) => dayjs(date).date()))
            : null;
    const dayOfWeek =
        info.frequency === RecurrenceFrequency.WEEKLY || info.frequency === RecurrenceFrequency.BIWEEKLY
            ? mode(dates.map((date) => dayjs(date).day()))
            : null;

    const amounts = rawAmounts.filter((value) => value > 0);
    const averageAmount = amounts.length ? amounts.reduce((total, value) => total + value, 0) / amounts.length : 0;
    const amountVariation = averageAmount
        ? amounts.reduce((total, value) => total + Math.abs(value - averageAmount), 0) /
          amounts.length /
          averageAmount
        : 0;

    const confidence = Math.min(
        97,
        Math.round(
            38 +
                Math.min(dates.length, 8) * 5 +
                consistency * 18 +
                Math.max(0, 1 - Math.min(1, amountVariation)) * 14
        )
    );

    return {
        frequency: info.frequency,
        intervalCount: info.intervalCount,
        dayOfMonth,
        dayOfWeek,
        nextDate: nextDateAfter(last, today, info, dayOfMonth),
        confidence,
        amountVariation,
    };
}

const mostFrequent = (values: string[]): string => {
    const counts = new Map<string, number>();
    for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? values[0] ?? "";
};

const pickLoanCategory = (
    categories: Category[],
    type: RecurringEntryType
): Category | undefined => {
    const matchingType = categories.filter(
        (category) => String(category.type) === String(type === RecurringEntryType.INCOME ? TypeTransaction.INCOME : TypeTransaction.EXPENSE)
    );
    const preferred = ["DEVOLUCION DE PRESTAMO", "DEVOLUCION DE PRESTAMOS", "PRESTAMOS", "PRESTAMO"];
    for (const name of preferred) {
        const match = matchingType.find((category) => normalizeCategoryName(category.name) === name);
        if (match) return match;
    }
    return matchingType[0];
};

export class RecurringSuggestionService {
    private transactionRepo = AppDataSourceProd.getRepository(Transaction);
    private paymentRepo = AppDataSourceProd.getRepository(RecurringPayment);
    private loanRepo = AppDataSourceProd.getRepository(Loan);
    private categoryRepo = AppDataSourceProd.getRepository(Category);
    private accountRepo = AppDataSourceProd.getRepository(Account);
    private contactRepo = AppDataSourceProd.getRepository(Contact);
    private planRepo = AppDataSourceProd.getRepository(LoanPlan);
    private dismissalRepo = AppDataSourceProd.getRepository(RecurringSuggestionDismissal);

    async getSuggestions(userId: UuidSchema): Promise<RecurringSuggestionsResponse> {
        const today = dayjs().startOf("day");
        const from = today.subtract(LOOKBACK_DAYS, "day").format("YYYY-MM-DD");
        const to = today.format("YYYY-MM-DD");

        const [transactions, payments, categories, accounts, loans, contacts, activePlans, dismissals] = await Promise.all([
            this.transactionRepo
                .createQueryBuilder("tx")
                .leftJoinAndSelect("tx.category", "category")
                .leftJoinAndSelect("tx.account", "account")
                .leftJoin("tx.loan", "loan")
                .where("tx.userId = :userId", { userId })
                .andWhere("tx.type IN (:...types)", {
                    types: [TypeTransaction.INCOME, TypeTransaction.EXPENSE],
                })
                .andWhere("tx.reportingImpact = :impact", {
                    impact: TransactionReportingImpact.REPORTABLE,
                })
                .andWhere("tx.isRecurrent = false")
                .andWhere("loan.id IS NULL")
                .andWhere("tx.date >= :from", { from })
                .andWhere("tx.date <= :to", { to })
                .andWhere(
                    `NOT EXISTS (SELECT 1 FROM "recurring_payment_occurrences" occ WHERE occ."transactionId" = tx.id)`
                )
                .orderBy("tx.date", "ASC")
                .getMany(),
            this.paymentRepo.find({ where: { user: { id: userId } } }),
            this.categoryRepo.find({ where: { user: { id: userId } } }),
            this.accountRepo.find({ where: { user: { id: userId } }, order: { createdAt: "ASC" } }),
            this.loanRepo.find({
                where: {
                    userId,
                    status: In([StatusLoan.PENDING, StatusLoan.PARTIALLY_PAID, StatusLoan.OVERDUE]),
                },
                relations: [
                    "contact",
                    "movements",
                    "movements.transaction",
                    "movements.transaction.account",
                    "transactionReference",
                    "transactionReference.account",
                ],
            }),
            this.contactRepo.find({ where: { userId, archived: false } }),
            this.planRepo.find({
                where: { userId, status: LoanPlanStatus.ACTIVE },
                select: ["id", "contactId"],
            }),
            this.dismissalRepo.find({ where: { userId }, select: ["suggestionId"] }),
        ]);

        const transactionSuggestions = this.buildTransactionSuggestions(
            transactions,
            payments,
            categories,
            today
        );
        const loanSuggestions = this.buildLoanSuggestions(
            loans,
            payments,
            categories,
            accounts,
            contacts,
            new Set(activePlans.map((plan) => plan.contactId)),
            today
        );

        const dismissed = new Set(dismissals.map((item) => item.suggestionId));
        const suggestions = [...loanSuggestions, ...transactionSuggestions]
            .filter((suggestion) => !dismissed.has(suggestion.id))
            .sort((a, b) => b.confidence - a.confidence)
            .slice(0, MAX_SUGGESTIONS);

        return {
            generatedAt: new Date().toISOString(),
            lookbackDays: LOOKBACK_DAYS,
            suggestions,
        };
    }

    private buildTransactionSuggestions(
        transactions: Transaction[],
        payments: RecurringPayment[],
        categories: Category[],
        today: Dayjs
    ): RecurringSuggestion[] {
        const categoriesById = new Map(categories.map((category) => [category.id, category]));
        const existingKeys = new Set<string>();
        for (const payment of payments) {
            const normalized = normalizeName(payment.name);
            existingKeys.add(`${payment.type}|${payment.categoryId}|${payment.accountId}|${normalized}`);
            existingKeys.add(`${payment.type}|${payment.categoryId}|${normalized}`);
        }

        interface Group {
            key: string;
            type: RecurringEntryType;
            categoryId: string;
            accountId: string;
            names: string[];
            dates: string[];
            amounts: number[];
            accountName: string;
            accountColor?: string;
            accountIcon?: string;
        }

        const groups = new Map<string, Group>();
        for (const transaction of transactions) {
            if (!transaction.category || !transaction.account) continue;
            if (LOAN_CATEGORY_NAMES.has(normalizeCategoryName(transaction.category.name))) continue;
            const normalized = normalizeName(transaction.name);
            if (!normalized) continue;
            const type =
                transaction.type === TypeTransaction.INCOME
                    ? RecurringEntryType.INCOME
                    : RecurringEntryType.EXPENSE;
            const key = `${type}|${transaction.category.id}|${transaction.account.id}|${normalized}`;
            const current =
                groups.get(key) ??
                ({
                    key,
                    type,
                    categoryId: transaction.category.id,
                    accountId: transaction.account.id,
                    names: [],
                    dates: [],
                    amounts: [],
                    accountName: transaction.account.name,
                    accountColor: transaction.account.color,
                    accountIcon: transaction.account.icon,
                } satisfies Group);
            if (typeof transaction.date === "string") current.dates.push(transaction.date);
            current.amounts.push(transaction.amount);
            current.names.push(transaction.name.trim());
            groups.set(key, current);
        }

        const suggestions: RecurringSuggestion[] = [];
        for (const group of groups.values()) {
            if (group.dates.length < MIN_OCCURRENCES) continue;
            const normalized = normalizeName(group.names[0]);
            if (
                existingKeys.has(`${group.type}|${group.categoryId}|${group.accountId}|${normalized}`) ||
                existingKeys.has(`${group.type}|${group.categoryId}|${normalized}`)
            ) {
                continue;
            }

            const pattern = detectRecurrence(group.dates, group.amounts, today);
            if (!pattern) continue;

            const amountCents = median(group.amounts.filter((value) => value > 0));
            if (amountCents <= 0) continue;

            const category = categoriesById.get(group.categoryId);
            const lastDate = [...group.dates].sort().at(-1) ?? null;
            const name = mostFrequent(group.names);

            suggestions.push({
                id: `transaction:${group.key}`,
                kind: "TRANSACTION",
                name,
                description: `Patrón detectado en ${group.dates.length} movimientos`,
                type: group.type,
                amount: money(amountCents),
                frequency: pattern.frequency,
                intervalCount: pattern.intervalCount,
                dayOfMonth: pattern.dayOfMonth,
                dayOfWeek: pattern.dayOfWeek,
                startDate: pattern.nextDate,
                maxOccurrences: null,
                accountId: group.accountId,
                categoryId: group.categoryId,
                loanAction: RecurringLoanAction.NONE,
                loanId: null,
                loanContactId: null,
                loanCounterparty: null,
                confidence: pattern.confidence,
                sampleCount: group.dates.length,
                lastDate,
                reason:
                    pattern.frequency === RecurrenceFrequency.MONTHLY
                        ? `Se repite cada mes alrededor del día ${pattern.dayOfMonth ?? dayjs(lastDate).date()}.`
                        : pattern.frequency === RecurrenceFrequency.YEARLY
                            ? "Se repite una vez al año en la misma fecha."
                            : `Se repite cada ${expectedDaysFor(pattern)} días aprox.`,
                account: {
                    id: group.accountId,
                    name: group.accountName,
                    color: group.accountColor,
                    icon: group.accountIcon,
                },
                category: category
                    ? {
                        id: category.id,
                        name: category.name,
                        color: category.color,
                        icon: category.icon,
                    }
                    : undefined,
            });
        }

        return suggestions;
    }

    private buildLoanSuggestions(
        loans: Loan[],
        payments: RecurringPayment[],
        categories: Category[],
        accounts: Account[],
        contacts: Contact[],
        planContactIds: Set<string>,
        today: Dayjs
    ): RecurringSuggestion[] {
        interface LoanGroup {
            key: string;
            contactId: string | null;
            lender: string;
            direction: TypeLoan;
            loans: Loan[];
            remaining: number;
            repayments: { date: string; amount: number }[];
            accountId: string | null;
        }

        const groups = new Map<string, LoanGroup>();
        for (const loan of loans) {
            const status = calculateLoanPaymentStatus(loan);
            if (status.totalRemaining <= 0) continue;

            const contactId = loan.contact?.id ?? null;
            const key = `${loan.type}|${contactId ?? normalizeName(loan.lender)}`;
            const current =
                groups.get(key) ??
                ({
                    key,
                    contactId,
                    lender: loan.contact?.name ?? loan.lender,
                    direction: loan.type,
                    loans: [],
                    remaining: 0,
                    repayments: [],
                    accountId: null,
                } satisfies LoanGroup);

            current.loans.push(loan);
            current.remaining += status.totalRemaining;

            const repayments = (loan.movements ?? [])
                .filter((movement) => movement.type === LoanMovementType.REPAYMENT)
                .sort((a, b) => a.date.localeCompare(b.date));
            for (const movement of repayments) {
                current.repayments.push({ date: movement.date, amount: movement.amount });
                const accountId = movement.transaction?.account?.id;
                if (accountId) current.accountId = accountId;
            }
            if (!current.accountId && loan.transactionReference?.account?.id) {
                current.accountId = loan.transactionReference.account.id;
            }
            groups.set(key, current);
        }

        const existingContacts = new Set<string>();
        const existingNames = new Set<string>();
        for (const payment of payments) {
            if (payment.loanAction !== RecurringLoanAction.PAY_LOAN || !payment.isActive) continue;
            if (payment.loanContactId) existingContacts.add(payment.loanContactId);
            if (payment.loanCounterparty) {
                existingNames.add(`${payment.type}|${normalizeName(payment.loanCounterparty)}`);
            }
        }

        const contactsByName = new Map(contacts.map((contact) => [normalizeName(contact.name), contact]));
        const suggestions: RecurringSuggestion[] = [];

        for (const group of groups.values()) {
            if (group.remaining <= 0) continue;
            if (group.contactId && (existingContacts.has(group.contactId) || planContactIds.has(group.contactId))) {
                continue;
            }

            const type =
                group.direction === TypeLoan.GIVEN
                    ? RecurringEntryType.INCOME
                    : RecurringEntryType.EXPENSE;
            if (!group.contactId && existingNames.has(`${type}|${normalizeName(group.lender)}`)) {
                continue;
            }

            const category = pickLoanCategory(categories, type);
            const accountId = group.accountId ?? accounts[0]?.id ?? null;
            if (!category || !accountId) continue;

            const contact = group.contactId
                ? contacts.find((item) => item.id === group.contactId)
                : contactsByName.get(normalizeName(group.lender));
            const repaymentDates = group.repayments.map((item) => item.date);
            const repaymentAmounts = group.repayments.map((item) => item.amount);
            const history = detectRecurrence(repaymentDates, repaymentAmounts, today);

            let frequency: RecurrenceFrequency;
            let intervalCount = 1;
            let dayOfMonth: number | null = null;
            let dayOfWeek: number | null = null;
            let startDate: string;
            let amount: number;
            let maxOccurrences: number | null = null;
            let reason: string;

            if (history) {
                const historyAmount = money(median(repaymentAmounts.filter((value) => value > 0)));
                const occurrences = historyAmount > 0
                    ? Math.min(24, Math.max(1, Math.ceil(group.remaining / historyAmount)))
                    : 1;

                if (historyAmount <= 0 || occurrences <= 1) {
                    frequency = RecurrenceFrequency.ONCE;
                    amount = group.remaining;
                    startDate = dayjs(today).add(1, "month").format("YYYY-MM-DD");
                    reason = `Tienes ${repaymentDates.length} pagos previos. Sugerimos liquidar el saldo en un solo pago.`;
                } else {
                    frequency = history.frequency;
                    intervalCount = history.intervalCount;
                    dayOfMonth = history.dayOfMonth;
                    dayOfWeek = history.dayOfWeek;
                    startDate = history.nextDate;
                    amount = historyAmount;
                    maxOccurrences = occurrences;
                    reason = `Detectamos ${repaymentDates.length} pagos previos con un ritmo de ~${expectedDaysFor(history)} días.`;
                }
            } else {
                const installments = group.remaining >= 400 ? 4 : 1;
                if (installments === 1) {
                    frequency = RecurrenceFrequency.ONCE;
                    amount = group.remaining;
                    startDate = dayjs(today).add(1, "month").format("YYYY-MM-DD");
                    reason = "Saldo pendiente sin cronograma activo.";
                } else {
                    frequency = RecurrenceFrequency.FIFTEEN_DAYS;
                    amount = Math.max(0.01, Math.round((group.remaining / installments) * 100) / 100);
                    maxOccurrences = installments;
                    startDate = dayjs(today).add(15, "day").format("YYYY-MM-DD");
                    reason = "Saldo pendiente sin cronograma activo. Propuesta en 4 cuotas cada 15 días.";
                }
            }

            const name =
                type === RecurringEntryType.INCOME
                    ? `Cobro de ${group.lender}`
                    : `Pago a ${group.lender}`;

            suggestions.push({
                id: `loan:${group.key}`,
                kind: "LOAN",
                name,
                description: `Deuda pendiente con ${group.lender}`,
                type,
                amount,
                frequency,
                intervalCount,
                dayOfMonth,
                dayOfWeek,
                startDate,
                maxOccurrences,
                accountId,
                categoryId: category.id,
                loanAction: RecurringLoanAction.PAY_LOAN,
                loanId: !group.contactId && group.loans.length === 1 ? group.loans[0].id : null,
                loanContactId: contact?.id ?? group.contactId,
                loanCounterparty: group.lender,
                confidence: history
                    ? Math.min(94, 60 + Math.min(repaymentDates.length, 6) * 5)
                    : 58,
                sampleCount: repaymentDates.length,
                lastDate: repaymentDates.at(-1) ?? null,
                reason,
                account: accounts.find((account) => account.id === accountId)
                    ? {
                        id: accountId,
                        name: accounts.find((account) => account.id === accountId)!.name,
                        color: accounts.find((account) => account.id === accountId)!.color,
                        icon: accounts.find((account) => account.id === accountId)!.icon,
                    }
                    : undefined,
                category: {
                    id: category.id,
                    name: category.name,
                    color: category.color,
                    icon: category.icon,
                },
                contact: contact ? { id: contact.id, name: contact.name } : undefined,
            });
        }

        return suggestions;
    }

    async dismissSuggestion(userId: UuidSchema, suggestionId: string): Promise<void> {
        await this.dismissalRepo
            .createQueryBuilder()
            .insert()
            .into(RecurringSuggestionDismissal)
            .values({ userId, suggestionId: suggestionId.trim() })
            .orIgnore()
            .execute();
    }
}
