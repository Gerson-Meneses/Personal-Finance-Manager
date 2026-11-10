import { z } from "zod";
import { RecurrenceFrequency, RecurringEntryType } from "../utils/Enums";

const dateString = (label: string) =>
    z.string({ message: `${label} es requerida` }).refine((value) => !isNaN(Date.parse(value)), {
        message: `${label} tiene un formato inválido`,
    });

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
    dayOfMonth: z.number().int().min(1).max(31).optional(),
    dayOfWeek: z.number().int().min(0).max(6).optional(),
    startDate: dateString("La fecha de inicio"),
    endDate: dateString("La fecha de fin").optional(),
    autoDebit: z.boolean().default(false),
    accountId: z.uuid({ message: "La cuenta es requerida" }),
    categoryId: z.uuid({ message: "La categoría es requerida" }),
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
        dayOfMonth: z.number().int().min(1).max(31).nullable().optional(),
        dayOfWeek: z.number().int().min(0).max(6).nullable().optional(),
        startDate: dateString("La fecha de inicio").optional(),
        endDate: dateString("La fecha de fin").nullable().optional(),
        autoDebit: z.boolean().optional(),
        accountId: z.uuid().optional(),
        categoryId: z.uuid().optional(),
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
