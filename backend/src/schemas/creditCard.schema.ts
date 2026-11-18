import { z } from "zod";
import { CreditChargeType, CreditDocumentType } from "../utils/Enums";

const amountSchema = z
    .number({ message: "El monto es requerido" })
    .positive({ message: "El monto debe ser mayor a 0" })
    .transform((value) => Math.round(value * 100));

const dateSchema = z
    .string({ message: "La fecha es requerida" })
    .refine((value) => !Number.isNaN(Date.parse(value)), { message: "Formato de fecha invalido" });

export const confirmPendingSchema = z.object({
    amount: amountSchema.optional(),
    description: z.string().trim().max(1000).optional(),
});

export type ConfirmPendingSchema = z.infer<typeof confirmPendingSchema>;

export const createInstallmentPlanSchema = z.object({
    transactionIds: z
        .array(z.uuid({ message: "Compra invalida" }))
        .min(1, { message: "Selecciona al menos una compra" })
        .max(100, { message: "Selecciona como maximo 100 compras" }),
    installments: z
        .number({ message: "El numero de cuotas es requerido" })
        .int({ message: "El numero de cuotas debe ser entero" })
        .min(2, { message: "El plan debe tener al menos 2 cuotas" })
        .max(60, { message: "El plan no puede superar 60 cuotas" }),
    tea: z
        .number({ message: "La TEA debe ser un numero" })
        .nonnegative({ message: "La TEA no puede ser negativa" })
        .max(1000, { message: "La TEA parece demasiado alta" })
        .optional(),
});

export type CreateInstallmentPlanSchema = z.infer<typeof createInstallmentPlanSchema>;

export const createChargeSchema = z.object({
    type: z.enum(CreditChargeType, { message: "Tipo de cargo invalido" }),
    amount: amountSchema,
    rate: z
        .number({ message: "La tasa debe ser un numero" })
        .nonnegative({ message: "La tasa no puede ser negativa" })
        .optional(),
    baseAmount: z
        .number({ message: "La base debe ser un numero" })
        .nonnegative({ message: "La base no puede ser negativa" })
        .transform((value) => Math.round(value * 100))
        .optional(),
    dueDate: dateSchema.optional(),
    description: z.string().trim().max(1000).optional(),
});

export type CreateChargeSchema = z.infer<typeof createChargeSchema>;

export const updateChargeSchema = z.object({
    amount: amountSchema.optional(),
    rate: z
        .number({ message: "La tasa debe ser un numero" })
        .nonnegative({ message: "La tasa no puede ser negativa" })
        .optional(),
    baseAmount: z
        .number({ message: "La base debe ser un numero" })
        .nonnegative({ message: "La base no puede ser negativa" })
        .transform((value) => Math.round(value * 100))
        .optional(),
    dueDate: dateSchema.optional(),
    description: z.string().trim().max(1000).optional(),
});

export type UpdateChargeSchema = z.infer<typeof updateChargeSchema>;

export const documentTypeSchema = z.enum(CreditDocumentType).optional();
