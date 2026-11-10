import { z } from "zod";

export const RecurrenceFrequencyValues = ["MONTHLY", "WEEKLY", "BIWEEKLY", "YEARLY"] as const;
export type RecurrenceFrequency = typeof RecurrenceFrequencyValues[number];

export const RecurringEntryTypeValues = ["EXPENSE", "INCOME"] as const;
export type RecurringEntryType = typeof RecurringEntryTypeValues[number];

export const RecurringOccurrenceStatusValues = ["PENDING", "DUE", "PAID", "SKIPPED", "FAILED"] as const;
export type RecurringOccurrenceStatus = typeof RecurringOccurrenceStatusValues[number];

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
    isActive: boolean;
    autoDebit: boolean;
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

export const RecurringPaymentFormSchema = z
    .object({
        name: z.string().trim().min(3, "El nombre debe tener al menos 3 caracteres").max(100),
        description: z.string().trim().max(500).optional(),
        type: z.enum(RecurringEntryTypeValues),
        amount: z.coerce.number().positive("El monto debe ser mayor a 0"),
        frequency: z.enum(RecurrenceFrequencyValues),
        intervalCount: z.coerce.number().int().positive("Debe ser mayor a 0"),
        dayOfMonth: z.coerce.number().int().min(1).max(31).optional(),
        dayOfWeek: z.coerce.number().int().min(0).max(6).optional(),
        startDate: z.string().min(1, "La fecha de inicio es requerida"),
        endDate: z.string().optional(),
        autoDebit: z.boolean(),
        accountId: z.string().uuid("Selecciona una cuenta"),
        categoryId: z.string().uuid("Selecciona una categoría"),
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
    });

export type RecurringPaymentFormInput = z.input<typeof RecurringPaymentFormSchema>;
export type RecurringPaymentFormOutput = z.output<typeof RecurringPaymentFormSchema>;

export type RecurringPaymentUpdate = Partial<RecurringPaymentFormOutput> & {
    isActive?: boolean;
};
