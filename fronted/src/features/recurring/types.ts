import { z } from "zod";

export const RecurrenceFrequencyValues = ["MONTHLY", "WEEKLY", "BIWEEKLY", "FIFTEEN_DAYS", "YEARLY", "ONCE"] as const;
export type RecurrenceFrequency = typeof RecurrenceFrequencyValues[number];

export const RecurringEntryTypeValues = ["EXPENSE", "INCOME"] as const;
export type RecurringEntryType = typeof RecurringEntryTypeValues[number];

export const RecurringOccurrenceStatusValues = ["PENDING", "DUE", "PAID", "SKIPPED", "FAILED"] as const;
export type RecurringOccurrenceStatus = typeof RecurringOccurrenceStatusValues[number];

export const RecurringLoanActionValues = ["NONE", "PAY_LOAN", "GIVE_LOAN", "RECEIVE_LOAN"] as const;
export type RecurringLoanAction = typeof RecurringLoanActionValues[number];

export interface RecurringAccountInfo {
    id: string;
    name: string;
    color?: string;
    icon?: string;
}

export interface RecurringCategoryInfo {
    id: string;
    name: string;
    color?: string;
    icon?: string;
}

export interface RecurringPayment {
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
    loanCounterparty?: string | null;
    loan?: { id: string; lender: string; type: "GIVEN" | "RECEIVED" } | null;
    nextDueDate?: string | null;
    account?: RecurringAccountInfo;
    category?: RecurringCategoryInfo;
    createdAt: string;
    updatedAt: string;
}

export interface RecurringOccurrence {
    id: string;
    paymentId: string;
    name: string;
    description?: string | null;
    type: RecurringEntryType;
    amount: number;
    dueDate: string;
    status: RecurringOccurrenceStatus;
    autoDebit: boolean;
    loanAction: RecurringLoanAction;
    loanCounterparty?: string | null;
    account?: RecurringAccountInfo | null;
    category?: RecurringCategoryInfo | null;
    transactionId?: string | null;
    failureReason?: string | null;
    notifiedAt?: string | null;
    executedAt?: string | null;
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
    occurrences: RecurringOccurrence[];
}

export interface PaymentNotification {
    id: string;
    title: string;
    message: string;
    readAt?: string | null;
    createdAt: string;
    occurrence?: {
        id: string;
        dueDate: string;
        amount: number;
        type: RecurringEntryType;
        status: RecurringOccurrenceStatus;
    };
}

const optionalCoercedInt = (min: number, max: number) =>
    z.preprocess(
        (value) => (value === "" || value === null || value === undefined ? undefined : Number(value)),
        z.number().int().min(min).max(max).optional()
    );

const optionalEndDate = z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.string().optional()
);

export const RecurringPaymentFormSchema = z
    .object({
        name: z.string().trim().min(3, "El nombre debe tener al menos 3 caracteres").max(100),
        description: z.string().trim().max(500).optional(),
        type: z.enum(RecurringEntryTypeValues),
        amount: z.coerce.number().positive("El monto debe ser mayor a 0"),
        frequency: z.enum(RecurrenceFrequencyValues),
        intervalCount: z.coerce.number().int().positive("Debe ser mayor a 0"),
        dayOfMonth: optionalCoercedInt(1, 31),
        dayOfWeek: optionalCoercedInt(0, 6),
        startDate: z.string().min(1, "La fecha de inicio es requerida"),
        endDate: optionalEndDate,
        maxOccurrences: z.preprocess(
            (value) => (value === "" || value === null || value === undefined ? undefined : Number(value)),
            z.number().int().min(1, "Debe ser al menos 1").max(500, "Máximo 500 repeticiones").optional()
        ),
        autoDebit: z.boolean(),
        accountId: z.string().uuid("Selecciona una cuenta"),
        categoryId: z.string().uuid("Selecciona una categoría"),
        loanAction: z.enum(RecurringLoanActionValues).default("NONE"),
        loanId: z.preprocess(
            (value) => (value === "" || value === null ? undefined : value),
            z.string().uuid("Selecciona un préstamo válido").optional()
        ),
        loanCounterparty: z.preprocess(
            (value) => (value === "" || value === null ? undefined : value),
            z.string().trim().min(3, "La persona debe tener al menos 3 caracteres").max(99).optional()
        ),
    })
    .superRefine((data, ctx) => {
        if (data.endDate && data.endDate < data.startDate) {
            ctx.addIssue({ code: "custom", path: ["endDate"], message: "No puede ser anterior al inicio" });
        }
        if (["WEEKLY", "BIWEEKLY"].includes(data.frequency) && data.dayOfWeek === undefined) {
            ctx.addIssue({ code: "custom", path: ["dayOfWeek"], message: "Selecciona un día" });
        }
        if (["MONTHLY", "YEARLY"].includes(data.frequency) && data.dayOfMonth === undefined) {
            ctx.addIssue({ code: "custom", path: ["dayOfMonth"], message: "Selecciona un día del mes" });
        }
        if (data.loanAction !== "NONE") {
            if (data.loanAction === "PAY_LOAN" && !data.loanId && !data.loanCounterparty) {
                ctx.addIssue({ code: "custom", path: ["loanCounterparty"], message: "Selecciona la persona o el préstamo que se va a pagar" });
            }
            if (data.loanAction !== "PAY_LOAN" && data.frequency !== "ONCE") {
                ctx.addIssue({ code: "custom", path: ["frequency"], message: "Solo los pagos de préstamo pueden tener cronograma" });
            }
            if ((data.loanAction === "GIVE_LOAN" || data.loanAction === "RECEIVE_LOAN") && !data.loanCounterparty) {
                ctx.addIssue({ code: "custom", path: ["loanCounterparty"], message: "Indica la persona del préstamo" });
            }
            if (data.loanAction === "GIVE_LOAN" && data.type !== "EXPENSE") {
                ctx.addIssue({ code: "custom", path: ["type"], message: "Un préstamo que otorgas es un gasto" });
            }
            if (data.loanAction === "RECEIVE_LOAN" && data.type !== "INCOME") {
                ctx.addIssue({ code: "custom", path: ["type"], message: "Un préstamo que recibes es un ingreso" });
            }
        }
    });

export type RecurringPaymentFormInput = z.input<typeof RecurringPaymentFormSchema>;
export type RecurringPaymentFormOutput = z.output<typeof RecurringPaymentFormSchema>;

export type RecurringPaymentUpdate = Partial<RecurringPaymentFormOutput> & {
    isActive?: boolean;
};
