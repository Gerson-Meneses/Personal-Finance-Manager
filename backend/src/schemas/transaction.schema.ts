import { z } from "zod";
import { TypeTransaction } from "../utils/Enums";

export const baseTransaction = {
    name: z.string().min(3).max(99),
    type: z.nativeEnum(TypeTransaction),
    amount: z.number().positive(),
    date: z.date(),
    time: z.string().optional(),
    description: z.string().optional()
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
    startDate: z.date().optional(),
    endDate: z.date().optional()
});

export const transactionSchema = z.discriminatedUnion('isRecurrent', [
    recurrentTransaction,
    nonRecurrentTransaction
]);

export type TransactionSchema = z.infer<typeof transactionSchema>