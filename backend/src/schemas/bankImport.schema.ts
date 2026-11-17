import { z } from "zod";
import { BankLineStatus, TypeTransaction } from "../utils/Enums";

const toCents = (value: number) => Math.round(value * 100);

const importLineSchema = z.object({
    date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha debe tener formato YYYY-MM-DD"),
    description: z
        .string()
        .trim()
        .min(1, "La descripción es obligatoria")
        .max(255, "La descripción no puede superar 255 caracteres"),
    amount: z
        .number({ message: "El monto es obligatorio" })
        .positive("El monto debe ser mayor que cero")
        .max(1_000_000_000, "El monto es demasiado grande")
        .transform(toCents),
    type: z.enum([TypeTransaction.INCOME, TypeTransaction.EXPENSE]),
    reference: z.string().trim().max(120).optional(),
});

export const importBankLinesSchema = z.object({
    accountId: z.uuid({ message: "accountId debe ser un UUID válido" }),
    lines: z
        .array(importLineSchema)
        .min(1, "Debes enviar al menos un movimiento")
        .max(1000, "No puedes importar más de 1000 movimientos a la vez"),
});

export const bankLinesQuerySchema = z.object({
    accountId: z.uuid().optional(),
    status: z.enum(BankLineStatus).optional(),
    limit: z.coerce.number().int().min(1).max(500).optional(),
});

export const matchBankLineSchema = z.object({
    transactionId: z.uuid({ message: "transactionId debe ser un UUID válido" }),
});

export const createFromBankLineSchema = z.object({
    categoryId: z.uuid({ message: "categoryId debe ser un UUID válido" }),
    name: z.string().trim().min(3).max(99).optional(),
    date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha debe tener formato YYYY-MM-DD")
        .optional(),
});

export type ImportBankLinesInput = z.infer<typeof importBankLinesSchema>;
export type ImportBankLinesOutput = z.output<typeof importBankLinesSchema>;
export type BankLinesQuery = z.infer<typeof bankLinesQuerySchema>;
export type MatchBankLineInput = z.infer<typeof matchBankLineSchema>;
export type CreateFromBankLineInput = z.infer<typeof createFromBankLineSchema>;
