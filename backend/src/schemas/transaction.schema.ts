import { z } from "zod";
import { TransactionReportingImpact, TypeTransaction } from "../utils/Enums";

const amountSchema = z
    .number({ message: "Amount es requerido" })
    .positive({ message: "Amount debe ser un número positivo" })
    .min(0.01, { message: "La cantidad mínima es 0.01" })
    .transform((num) => {
        return Math.round(num * 100);
    })

export const transactionSplitSchema = z.object({
    categoryId: z.uuid({ message: "Category ID de la división es requerido" }),

    amount: amountSchema,

    description: z
        .string({ message: "La descripción de la división debe ser texto." })
        .trim()
        .max(255, { message: "La descripción no puede exceder los 255 caracteres" })
        .optional(),

    tagIds: z
        .array(z.uuid({ message: "Tag ID inválido" }))
        .max(20, { message: "Máximo 20 etiquetas por división" })
        .optional(),
});

export type TransactionSplitSchema = z.infer<typeof transactionSplitSchema>;

export const transactionItemSchema = z.object({
    name: z
        .string({ message: "El nombre del producto es requerido" })
        .trim()
        .min(2, { message: "El nombre del producto debe tener al menos 2 caracteres" })
        .max(255, { message: "El nombre del producto no puede exceder los 255 caracteres" }),

    description: z
        .string({ message: "El comentario debe ser texto" })
        .trim()
        .max(500, { message: "El comentario no puede exceder los 500 caracteres" })
        .optional(),

    quantity: z.coerce
        .number({ message: "La cantidad debe ser numérica" })
        .positive({ message: "La cantidad debe ser mayor a 0" })
        .max(1_000_000, { message: "La cantidad es demasiado grande" })
        .default(1),

    unitPrice: z.coerce
        .number({ message: "El precio unitario debe ser numérico" })
        .nonnegative({ message: "El precio unitario no puede ser negativo" })
        .transform((value) => Math.round(value * 100)),

    total: z.coerce
        .number({ message: "El total debe ser numérico" })
        .nonnegative({ message: "El total no puede ser negativo" })
        .transform((value) => Math.round(value * 100))
        .optional(),
});

export type TransactionItemSchema = z.infer<typeof transactionItemSchema>;

export const baseTransaction = {
    name: z
        .string({ message: "Nombre es requerido" })
        .trim()
        .min(3, { message: "Nombre debe tener al menos 3 caracteres" })
        .max(99, { message: "Nombre debe tener como máximo 99 caracteres" }),

    type: z
        .enum([TypeTransaction.INCOME, TypeTransaction.EXPENSE], {
            message: "Type debe ser uno de estos valores: 'INCOME', 'EXPENSE'",
        }),


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

    categoryId: z.uuid({ message: "Category ID es requerido" }).optional(),

    accountId: z.uuid({ message: "Account ID es requerido" }),

    reportingImpact: z.enum(TransactionReportingImpact).optional(),

    tagIds: z
        .array(z.uuid({ message: "Tag ID inválido" }))
        .max(20, { message: "Máximo 20 etiquetas por transacción" })
        .optional(),

    splits: z
        .array(transactionSplitSchema)
        .max(20, { message: "Máximo 20 divisiones por transacción" })
        .optional(),

    merchantName: z
        .string({ message: "El establecimiento debe ser texto" })
        .trim()
        .max(150, { message: "El establecimiento no puede exceder los 150 caracteres" })
        .optional(),

    merchantAddress: z
        .string({ message: "La dirección debe ser texto" })
        .trim()
        .max(255, { message: "La dirección no puede exceder los 255 caracteres" })
        .optional(),

    items: z
        .array(transactionItemSchema)
        .max(100, { message: "Máximo 100 productos por transacción" })
        .optional(),

    /** Permite guardar aunque la suma de productos no coincida con el monto. */
    allowItemMismatch: z.boolean().optional(),
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


    amount: amountSchema.optional(),

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

    type: z.enum([TypeTransaction.INCOME, TypeTransaction.EXPENSE], {
        message: "Type debe ser uno de estos valores: 'INCOME', 'EXPENSE'"
    }).optional(),

    relatedAccountId: z.string({ message: "Related Account ID debe ser una cadena de texto." })
        .uuid({ message: "Related Account ID debe ser un UUID válido" })
        .optional(),

    tagIds: z
        .array(z.uuid({ message: "Tag ID inválido" }))
        .max(20, { message: "Máximo 20 etiquetas por transacción" })
        .optional(),

    splits: z
        .array(transactionSplitSchema)
        .max(20, { message: "Máximo 20 divisiones por transacción" })
        .optional(),

    merchantName: z
        .string({ message: "El establecimiento debe ser texto" })
        .trim()
        .max(150, { message: "El establecimiento no puede exceder los 150 caracteres" })
        .optional(),

    merchantAddress: z
        .string({ message: "La dirección debe ser texto" })
        .trim()
        .max(255, { message: "La dirección no puede exceder los 255 caracteres" })
        .optional(),

    items: z
        .array(transactionItemSchema)
        .max(100, { message: "Máximo 100 productos por transacción" })
        .optional(),

    /** Permite guardar aunque la suma de productos no coincida con el monto. */
    allowItemMismatch: z.boolean().optional(),
})

export type UpdateTransactionSchema = z.infer<typeof updateTransactionSchema>
