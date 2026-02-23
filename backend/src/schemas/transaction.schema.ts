import { z } from "zod";
import { TypeAccount, TypeTransaction } from "../utils/Enums";

export const baseTransaction = {
    name: z.string().min(3).max(99),
    type: z.enum(TypeTransaction),
    amount: z.number().positive().min(0.1, { message: "La cantidad minima son 10 centavos." }),
    date: z.string().refine((date) => !isNaN(Date.parse(date)), { message: "Invalid date format" }), 
    time: z.string().optional(),
    description: z.string().optional(),
    categoryId: z.uuid(),
    accountId: z.uuid(),
};

export const nonRecurrentTransaction = z.object({
    ...baseTransaction,
    isRecurrent: z.literal(false).optional()
});

export const recurrentTransaction = z.object({
    ...baseTransaction,
    isRecurrent: z.literal(true),
    frequency: z.number().int().positive(),
    frequencyCount: z.number().int().positive(),
    startDate: z.string().refine((date) => !isNaN(Date.parse(date)), { message: "Invalid date format" }).optional(),
    endDate: z.string().refine((date) => !isNaN(Date.parse(date)), { message: "Invalid date format" }).optional()
});

export const transactionSchema = z.discriminatedUnion('isRecurrent', [
    recurrentTransaction,
    nonRecurrentTransaction
]);

export type TransactionSchema = z.infer<typeof transactionSchema>

export const updateTransactionSchema = z.object({
    name: z.string().min(3).max(99).optional(),
    description: z.string().optional(),
    amount: z.number().positive().min(10, { message: "La cantidad minima son 10 centavos." }).optional(),
    date: z.string().refine((date) => !isNaN(Date.parse(date)), { message: "Invalid date format" }).optional(),
    time: z.string().optional(),
    category: z.string().toUpperCase().optional()
})

export type UpdateTransactionSchema = z.infer<typeof updateTransactionSchema>
