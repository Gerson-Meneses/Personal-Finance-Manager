import { z } from "zod";
import { TypeTransaction } from "../utils/Enums";

const amountSchema = z
    .number({ message: "Amount es requerido" })
    .positive({ message: "Amount debe ser un número positivo" })
    .min(0.01, { message: "La cantidad mínima es 0.01" })
    .transform((num) => {
        return Math.round(num * 100);
    })

export const baseTransaction = {
    name: z
        .string({ message: "Nombre es requerido" })
        .trim()
        .min(3, { message: "Nombre debe tener al menos 3 caracteres" })
        .max(99, { message: "Nombre debe tener como máximo 99 caracteres" }),

    type: z
        .enum(TypeTransaction, { message: "Type debe ser uno de estos valores: 'EXPENSE', 'INCOME'" }),


    amount: amountSchema,

    date: z
        .string({ message: "Date es requerido" })
        .refine((date) => !isNaN(Date.parse(date)), { message: "Invalid date format" }),

    time: z
        .string({ message: "Time debe tener un formato válido(HH:mm)" })
        .optional(),

    description: z
        .string({ message: "Description debe ser una cadena de texto." })
        .optional(),

    categoryId: z.uuid({ message: "Category ID es requerido" }),

    accountId: z.uuid({ message: "Account ID es requerido" }),
};

export const nonRecurrentTransaction = z.object({
    ...baseTransaction,
    isRecurrent: z.literal(false).optional()
});

export const recurrentTransaction = z.object({
    ...baseTransaction,
    isRecurrent: z.literal(true),
    frequency: z.number({ message: "Frequency es requerido" }).int().positive(),
    frequencyCount: z.number({ message: "Frequency Count es requerido" }).int().positive(),
    startDate: z.string({ message: "Start Date es requerido" })
        .refine((date) => !isNaN(Date.parse(date)), { message: "Invalid date format" })
        .optional(),
    endDate: z.string({ message: "End Date es requerido" })
        .refine((date) => !isNaN(Date.parse(date)), { message: "Invalid date format" })
        .optional()
});

export const transactionSchema = z.discriminatedUnion('isRecurrent', [
    recurrentTransaction,
    nonRecurrentTransaction
]);

export type TransactionSchema = z.infer<typeof transactionSchema>

export const updateTransactionSchema = z.object({
    name: z
        .string({ message: "Nombre debe ser una cadena de texto." })
        .trim()
        .min(3, { message: "Nombre debe tener al menos 3 caracteres" })
        .max(99, { message: "Nombre debe tener como máximo 99 caracteres" })
        .optional(),

    description: z
        .string({ message: "Description debe ser una cadena de texto." })
        .optional(),

    amount: amountSchema.nullish(),

    date: z
        .string({ message: "Date debe ser una cadena de texto." })
        .refine((date) => !isNaN(Date.parse(date)), { message: "Formato de fecha inválido" })
        .optional(),

    time: z
        .string({ message: "Time debe ser una cadena de texto." })
        .optional(),

    categoryId: z.string({ message: "Category ID debe ser una cadena de texto." })
        .uuid({ message: "Category ID debe ser un UUID válido" })
        .optional(),

    accountId: z.string({ message: "Account ID debe ser una cadena de texto." })
        .uuid({ message: "Account ID debe ser un UUID válido" })
        .optional(),

    type: z.enum(TypeTransaction, {
        message: "Type debe ser uno de estos valores: 'EXPENSE', 'INCOME', 'TRANSFER', 'CREDIT_PAYMENT'"
    }).optional(),

    relatedAccountId: z.string({ message: "Related Account ID debe ser una cadena de texto." })
        .uuid({ message: "Related Account ID debe ser un UUID válido" })
        .optional()
})

export type UpdateTransactionSchema = z.infer<typeof updateTransactionSchema>