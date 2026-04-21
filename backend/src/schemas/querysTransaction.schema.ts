import { z } from 'zod';
import { TypeTransaction } from '../utils/Enums';

export const transactionQuerySchema = z.object({
    type: z.enum(TypeTransaction).nullish(),
    accountId: z.uuid().nullish(),
    categoryId: z.uuid().nullish(),

    date: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date").nullish(),
    from: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date").nullish(),
    to: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date").nullish(),

    amount: z.preprocess((val) => (val === undefined || val === null ? undefined : Number(val)),
        z.number().transform(n => n * 100).nullish()
    ),

    minAmount: z.string().pipe(z.coerce.number()).transform(n => n * 100).nullish(),
    maxAmount: z.string().pipe(z.coerce.number()).transform(n => n * 100).nullish(),

    relatedAccountId: z.uuid().nullish(),

    // Paginación limpia
    page: z.coerce.number().positive().nullish(),
    limit: z.coerce.number().min(1).max(100).nullish(),

    order: z.enum(['ASC', 'DESC']).nullish(),
});

export type TransactionQuerySchema = z.infer<typeof transactionQuerySchema>;
