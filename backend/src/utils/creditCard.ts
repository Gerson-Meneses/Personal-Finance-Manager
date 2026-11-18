import dayjs from "dayjs";

export interface CreditCardCycle {
    closingDate: string;
    dueDate: string;
    periodKey: string;
}

export interface AllocatablePayment {
    amount: number;
    date: string;
}

export interface AllocatableItem {
    amount: number;
    paid: number;
    closingDate: string;
}

/**
 * Aplica pagos solo a deuda ya facturada.
 * Un pago nunca puede pagar un item cuyo cierre sea posterior a la fecha del pago.
 * Los items deben venir ordenados por vencimiento/prioridad.
 */
export const allocatePaymentsToBilledItems = (
    items: AllocatableItem[],
    payments: AllocatablePayment[]
): void => {
    for (const payment of payments) {
        const paymentDate = toYmd(payment.date);
        let remaining = payment.amount;
        for (const item of items) {
            if (remaining <= 0) break;
            if (item.closingDate > paymentDate) continue;
            const outstanding = Math.max(0, item.amount - item.paid);
            if (outstanding <= 0) continue;
            const applied = Math.min(remaining, outstanding);
            item.paid += applied;
            remaining -= applied;
        }
    }
};

export interface InstallmentScheduleRow {
    number: number;
    closingDate: string;
    dueDate: string;
    principal: number;
    interest: number;
    total: number;
}

const clampDay = (value: dayjs.Dayjs, day: number) =>
    value.date(Math.min(Math.max(1, day), value.daysInMonth()));

export const toYmd = (value: string | Date | dayjs.Dayjs): string =>
    dayjs(value).format("YYYY-MM-DD");

export const monthlyRateFromTea = (teaPercent: number): number => {
    if (!Number.isFinite(teaPercent) || teaPercent <= 0) return 0;
    return Math.pow(1 + teaPercent / 100, 1 / 12) - 1;
};

/** Cierre al que pertenece una compra. El día de cierre es inclusivo. */
export const closingDateForPurchase = (purchaseDate: string | Date, closeDay: number): string => {
    const purchase = dayjs(purchaseDate).startOf("day");
    let closing = clampDay(purchase, closeDay).startOf("day");
    if (purchase.isAfter(closing, "day")) {
        closing = clampDay(purchase.add(1, "month"), closeDay).startOf("day");
    }
    return closing.format("YYYY-MM-DD");
};

/** Vencimiento del pago: siempre posterior al cierre. */
export const dueDateForClosing = (closingDate: string | Date, dueDay: number): string => {
    const closing = dayjs(closingDate).startOf("day");
    let due = clampDay(closing, dueDay).startOf("day");
    if (!due.isAfter(closing, "day")) {
        due = clampDay(closing.add(1, "month"), dueDay).startOf("day");
    }
    return due.format("YYYY-MM-DD");
};

export const cycleForDate = (
    date: string | Date,
    closeDay: number,
    dueDay: number
): CreditCardCycle => {
    const closingDate = closingDateForPurchase(date, closeDay);
    return {
        closingDate,
        dueDate: dueDateForClosing(closingDate, dueDay),
        periodKey: closingDate.slice(0, 7),
    };
};

/** Cierre inmediatamente anterior (o igual) a una fecha de vencimiento. */
export const closingDateForDueDate = (dueDate: string | Date, closeDay: number): string => {
    const due = dayjs(dueDate).startOf("day");
    let closing = clampDay(due, closeDay).startOf("day");
    if (closing.isAfter(due, "day")) {
        closing = clampDay(due.subtract(1, "month"), closeDay).startOf("day");
    }
    return closing.format("YYYY-MM-DD");
};

/** Primera fecha de pago estrictamente posterior a hoy. */
export const nextDueDate = (today: string | Date, closeDay: number, dueDay: number): string => {
    const base = dayjs(today).startOf("day");
    let closing = closingDateForPurchase(base.format("YYYY-MM-DD"), closeDay);
    let due = dueDateForClosing(closing, dueDay);
    if (!dayjs(due).isAfter(base, "day")) {
        closing = clampDay(dayjs(closing).add(1, "month"), closeDay).format("YYYY-MM-DD");
        due = dueDateForClosing(closing, dueDay);
    }
    return due;
};

export const addMonthsToYmd = (date: string | Date, months: number, preferredDay: number): string => {
    const base = dayjs(date).add(months, "month");
    return clampDay(base, preferredDay).format("YYYY-MM-DD");
};

export const buildInstallmentSchedule = (options: {
    principal: number;
    installmentsCount: number;
    teaPercent: number;
    firstDueDate: string;
    closeDay: number;
}): { rows: InstallmentScheduleRow[]; totalInterest: number; totalAmount: number } => {
    const { principal, installmentsCount, teaPercent, firstDueDate, closeDay } = options;
    const monthlyRate = monthlyRateFromTea(teaPercent);
    const n = installmentsCount;

    const fixedPayment =
        monthlyRate > 0
            ? Math.round((principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -n)))
            : Math.round(principal / n);

    const rows: InstallmentScheduleRow[] = [];
    let balance = principal;
    let totalInterest = 0;

    for (let index = 1; index <= n; index += 1) {
        const interest = monthlyRate > 0 ? Math.round(balance * monthlyRate) : 0;
        let principalPart = fixedPayment - interest;

        if (index === n) {
            principalPart = balance;
        }

        if (principalPart < 0) principalPart = 0;
        if (principalPart > balance) principalPart = balance;

        const total = principalPart + interest;
        balance -= principalPart;
        totalInterest += interest;

        const dueDate = addMonthsToYmd(firstDueDate, index - 1, dayjs(firstDueDate).date());

        rows.push({
            number: index,
            closingDate: closingDateForDueDate(dueDate, closeDay),
            dueDate,
            principal: principalPart,
            interest,
            total,
        });
    }

    return {
        rows,
        totalInterest,
        totalAmount: principal + totalInterest,
    };
};
