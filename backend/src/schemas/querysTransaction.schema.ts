import { z } from 'zod';
import { TypeTransaction } from '../utils/Enums';

const optionalMoney = z.preprocess(
    (val) => (val === undefined || val === null || val === '' ? undefined : Number(val)),
    z.number().nonnegative("El monto debe ser positivo").transform(n => Math.round(n * 100)).nullish()
);

export const transactionQuerySchema = z.object({
    type: z.enum(TypeTransaction).nullish(),
    accountId: z.uuid().nullish(),
    relatedAccountId: z.uuid().nullish(),
    categoryId: z.uuid().nullish(),

    search: z.string().trim().min(1).max(100).nullish(),

    date: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date").nullish(),
    from: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date").nullish(),
    to: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date").nullish(),

    amount: z.preprocess(
        (val) => (val === undefined || val === null || val === '' ? undefined : Number(val)),
        z.number().nonnegative().transform(n => Math.round(n * 100)).nullish()
    ),

    minAmount: optionalMoney,
    maxAmount: optionalMoney,

    // Paginación limpia
    page: z.coerce.number().positive().nullish(),
    limit: z.coerce.number().min(1).max(9999).nullish(),

    orderBy: z.enum(['date', 'amount', 'name', 'createdAt']).default('date'),
    order: z.enum(['ASC', 'DESC']).default('DESC'),
});

export type TransactionQuerySchema = z.infer<typeof transactionQuerySchema>;
