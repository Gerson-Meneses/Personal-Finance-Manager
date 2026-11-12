import { z } from "zod";
import { RecurrenceFrequency, RecurringEntryType, RecurringLoanAction } from "../utils/Enums";

const dateString = (label: string) =>
    z.string({ message: `${label} es requerida` }).refine((value) => !isNaN(Date.parse(value)), {
        message: `${label} tiene un formato inválido`,
    });

const optionalDateString = (label: string) =>
    z.preprocess(
        (value) => (value === "" || value === null ? undefined : value),
        dateString(label).optional()
    );

const optionalInt = (min: number, max: number, message: string) =>
    z.preprocess(
        (value) => (value === "" || value === null || value === undefined ? undefined : Number(value)),
        z.number().int().min(min).max(max).optional()
    );

const nullableOptionalDate = (label: string) =>
    z.preprocess(
        (value) => (value === "" ? null : value),
        dateString(label).nullable().optional()
    );

const nullableOptionalInt = (min: number, max: number) =>
    z.preprocess(
        (value) => {
            if (value === "" || value === null) return null;
            if (value === undefined) return undefined;
            return Number(value);
        },
        z.number().int().min(min).max(max).nullable().optional()
    );

const amountSchema = z
    .number({ message: "El monto es requerido" })
    .positive({ message: "El monto debe ser mayor a 0" })
    .transform((value) => Math.round(value * 100));

const baseRecurringPayment = z.object({
    name: z
        .string({ message: "El nombre es requerido" })
        .trim()
        .min(3, { message: "El nombre debe tener al menos 3 caracteres" })
        .max(100, { message: "El nombre no puede exceder 100 caracteres" }),
    description: z.string().trim().max(500).optional(),
    type: z.enum(RecurringEntryType, { message: "El tipo debe ser INCOME o EXPENSE" }),
    amount: amountSchema,
    frequency: z.enum(RecurrenceFrequency, { message: "Frecuencia inválida" }),
    intervalCount: z.number().int().positive().default(1),
    dayOfMonth: optionalInt(1, 31, "El día del mes debe estar entre 1 y 31"),
    dayOfWeek: optionalInt(0, 6, "El día de la semana debe estar entre 0 y 6"),
    startDate: dateString("La fecha de inicio"),
    endDate: optionalDateString("La fecha de fin"),
    maxOccurrences: optionalInt(1, 500, "El número de repeticiones debe estar entre 1 y 500"),
    autoDebit: z.boolean().default(false),
    accountId: z.uuid({ message: "La cuenta es requerida" }),
    categoryId: z.uuid({ message: "La categoría es requerida" }),
    loanAction: z.enum(RecurringLoanAction).default(RecurringLoanAction.NONE),
    loanId: z.preprocess(
        (value) => (value === "" || value === null ? undefined : value),
        z.uuid({ message: "El préstamo seleccionado no es válido" }).optional()
    ),
    loanCounterparty: z.preprocess(
        (value) => (value === "" || value === null ? undefined : value),
        z.string().trim().min(3, { message: "La persona debe tener al menos 3 caracteres" }).max(99).optional()
    ),
});

export const createRecurringPaymentSchema = baseRecurringPayment.superRefine((data, ctx) => {
    if (data.endDate && data.endDate < data.startDate) {
        ctx.addIssue({
            code: "custom",
            path: ["endDate"],
            message: "La fecha de fin no puede ser anterior a la fecha de inicio",
        });
    }

    if (data.frequency === RecurrenceFrequency.WEEKLY || data.frequency === RecurrenceFrequency.BIWEEKLY) {
        if (data.dayOfWeek === undefined) {
            ctx.addIssue({
                code: "custom",
                path: ["dayOfWeek"],
                message: "Selecciona el día de la semana",
            });
        }
    }

    if (data.frequency === RecurrenceFrequency.MONTHLY || data.frequency === RecurrenceFrequency.YEARLY) {
        if (data.dayOfMonth === undefined) {
            ctx.addIssue({
                code: "custom",
                path: ["dayOfMonth"],
                message: "Selecciona el día del mes",
            });
        }
    }

    if (data.loanAction !== RecurringLoanAction.NONE) {
        if (
            data.loanAction === RecurringLoanAction.PAY_LOAN &&
            !data.loanId &&
            !data.loanCounterparty
        ) {
            ctx.addIssue({
                code: "custom",
                path: ["loanCounterparty"],
                message: "Selecciona la persona o el préstamo que se va a pagar",
            });
        }
        if (
            data.loanAction !== RecurringLoanAction.PAY_LOAN &&
            data.frequency !== RecurrenceFrequency.ONCE
        ) {
            ctx.addIssue({
                code: "custom",
                path: ["frequency"],
                message: "Solo los pagos de préstamo pueden tener cronograma",
            });
        }
        if (
            (data.loanAction === RecurringLoanAction.GIVE_LOAN ||
                data.loanAction === RecurringLoanAction.RECEIVE_LOAN) &&
            !data.loanCounterparty
        ) {
            ctx.addIssue({
                code: "custom",
                path: ["loanCounterparty"],
                message: "Indica la persona del préstamo",
            });
        }
        if (
            data.loanAction === RecurringLoanAction.GIVE_LOAN &&
            data.type !== RecurringEntryType.EXPENSE
        ) {
            ctx.addIssue({
                code: "custom",
                path: ["type"],
                message: "Un préstamo que otorgas es un gasto",
            });
        }
        if (
            data.loanAction === RecurringLoanAction.RECEIVE_LOAN &&
            data.type !== RecurringEntryType.INCOME
        ) {
            ctx.addIssue({
                code: "custom",
                path: ["type"],
                message: "Un préstamo que recibes es un ingreso",
            });
        }
    }
});

export type CreateRecurringPaymentInput = z.input<typeof createRecurringPaymentSchema>;
export type CreateRecurringPaymentOutput = z.output<typeof createRecurringPaymentSchema>;

export const updateRecurringPaymentSchema = z
    .object({
        name: z.string().trim().min(3).max(100).optional(),
        description: z.string().trim().max(500).nullable().optional(),
        type: z.enum(RecurringEntryType).optional(),
        amount: z.number().positive().transform((value) => Math.round(value * 100)).optional(),
        frequency: z.enum(RecurrenceFrequency).optional(),
        intervalCount: z.number().int().positive().optional(),
        dayOfMonth: nullableOptionalInt(1, 31),
        dayOfWeek: nullableOptionalInt(0, 6),
        startDate: dateString("La fecha de inicio").optional(),
        endDate: nullableOptionalDate("La fecha de fin"),
        maxOccurrences: nullableOptionalInt(1, 500),
        autoDebit: z.boolean().optional(),
        accountId: z.uuid().optional(),
        categoryId: z.uuid().optional(),
        loanAction: z.enum(RecurringLoanAction).optional(),
        loanId: z.preprocess(
            (value) => (value === "" ? null : value),
            z.uuid().nullable().optional()
        ),
        loanCounterparty: z.preprocess(
            (value) => (value === "" ? null : value),
            z.string().trim().min(3).max(99).nullable().optional()
        ),
        isActive: z.boolean().optional(),
    })
    .refine((data) => Object.values(data).some((value) => value !== undefined), {
        message: "Debes enviar al menos un campo para actualizar",
    });

export type UpdateRecurringPaymentOutput = z.output<typeof updateRecurringPaymentSchema>;

export const recurringMonthQuerySchema = z.object({
    month: z
        .string()
        .regex(/^\d{4}-(0[1-9]|1[0-2])$/, { message: "El mes debe tener formato YYYY-MM" })
        .optional(),
});

export type RecurringMonthQuery = z.infer<typeof recurringMonthQuerySchema>;

export const executeOccurrenceSchema = z.object({
    accountId: z.uuid().optional(),
    date: dateString("La fecha").optional(),
    time: z
        .string()
        .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: "La hora debe tener formato HH:mm" })
        .optional(),
    description: z.string().trim().max(500).optional(),
});

export type ExecuteOccurrenceOutput = z.output<typeof executeOccurrenceSchema>;

export const skipOccurrenceSchema = z.object({
    reason: z.string().trim().max(300).optional(),
});

export type SkipOccurrenceOutput = z.output<typeof skipOccurrenceSchema>;
