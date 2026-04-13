import { z } from 'zod';
import { TypeTransaction } from '../utils/Enums';

export const transactionQuerySchema = z.object({

    type: z.enum(TypeTransaction).optional(),

    accountId: z.uuid().optional(),
    categoryId: z.uuid().optional(),

    date: z
        .string()
        .refine((date) => !isNaN(Date.parse(date)), { message: "Invalid date format" })
        .optional(),

    from: z
        .string()
        .refine((date) => !isNaN(Date.parse(date)), { message: "Invalid date format" })
        .optional(),

    to: z
        .string()
        .refine((date) => !isNaN(Date.parse(date)), { message: "Invalid date format" })
        .optional(),

    amount: z
        .string()
        .transform(Number)
        .refine((v) => !isNaN(v), 'minAmount must be a number')
        .transform(n => n * 100)
        .optional(),

    minAmount: z
        .string()
        .transform(Number)
        .refine((v) => !isNaN(v), 'minAmount must be a number')
        .transform(n => n * 100)
        .optional(),

    maxAmount: z
        .string()
        .transform(Number)
        .refine((v) => !isNaN(v), 'maxAmount must be a number')
        .transform(n => n * 100)
        .optional(),

    relatedAccountId: z.uuid().optional(),

    page: z
        .string()
        .transform(Number)
        .refine((v) => v > 0, 'page must be > 0')
        .optional(),

    limit: z
        .string()
        .transform(Number)
        .refine((v) => v > 0 && v <= 100, 'limit must be between 1 and 100')
        .optional(),

    order: z.enum(['ASC', 'DESC']).optional(),
});


export type TransactionQuerySchema = z.infer<typeof transactionQuerySchema>