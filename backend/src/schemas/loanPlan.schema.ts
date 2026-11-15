import { z } from "zod";
import { RecurrenceFrequency, TypeLoan } from "../utils/Enums";
import { amountSchema, dateSchema, timeSchema } from "./base.schema";

const startDateSchema = z
    .string({ message: "La fecha de inicio es requerida" })
    .refine((value) => !isNaN(Date.parse(value)), { message: "Fecha inválida" });

export const createLoanPlanSchema = z.object({
    amountPerInstallment: amountSchema(),
    installmentCount: z.coerce.number().int().min(1).max(500),
    startDate: startDateSchema,
    frequency: z.enum(RecurrenceFrequency).default(RecurrenceFrequency.FIFTEEN_DAYS),
    intervalCount: z.coerce.number().int().min(1).max(12).default(1),
    notes: z.string().trim().max(500).optional(),
});

export type CreateLoanPlanOutput = z.output<typeof createLoanPlanSchema>;

export const createContactLoanPlanSchema = createLoanPlanSchema.extend({
    direction: z.enum(TypeLoan, { message: "La dirección debe ser GIVEN o RECEIVED" }),
});

export type CreateContactLoanPlanOutput = z.output<typeof createContactLoanPlanSchema>;

export const cancelLoanPlanSchema = z.object({
    reason: z.string().trim().max(300).optional(),
});

export type CancelLoanPlanOutput = z.output<typeof cancelLoanPlanSchema>;

export const debtMonthQuerySchema = z.object({
    month: z
        .string()
        .regex(/^\d{4}-(0[1-9]|1[0-2])$/, { message: "El mes debe tener formato YYYY-MM" })
        .optional(),
});

export type DebtMonthQuery = z.infer<typeof debtMonthQuerySchema>;

export const payInstallmentSchema = z.object({
    amount: amountSchema().optional(),
    date: dateSchema().transform((value) => value.toISOString().slice(0, 10)),
    time: timeSchema().optional(),
    accountId: z.uuid({ message: "Selecciona una cuenta" }),
    description: z.string().trim().max(300).optional(),
});

export type PayInstallmentOutput = z.output<typeof payInstallmentSchema>;


export const updateLoanPlanSchema = z
    .object({
        amountPerInstallment: amountSchema().optional(),
        installmentCount: z.coerce.number().int().min(1).max(500).optional(),
        startDate: startDateSchema.optional(),
        frequency: z.enum(RecurrenceFrequency).optional(),
        intervalCount: z.coerce.number().int().min(1).max(12).optional(),
        notes: z.string().trim().max(500).nullable().optional(),
    })
    .refine((data) => Object.values(data).some((value) => value !== undefined), {
        message: "Debes enviar al menos un campo para actualizar",
    });

export type UpdateLoanPlanOutput = z.output<typeof updateLoanPlanSchema>;
