import { z } from 'zod';
import { TypeAccount } from '../utils/Enums';


const baseAccount = {
  name: z.string().min(2).max(99).toUpperCase(),
  balance: z.number().nonnegative().optional(),
};

const debitAccountSchema = z.object({
  ...baseAccount,
  type: z.literal(TypeAccount.DEBIT)
});

const cashAccountSchema = z.object({
  ...baseAccount,
  type: z.literal(TypeAccount.CASH)
});

const creditAccountSchema = z.object({
  ...baseAccount,
  type: z.literal(TypeAccount.CREDIT),
  creditLimit: z.number().positive(),
  billingCloseDay: z.number().int().min(1).max(31),
  paymentDueDay: z.number().int().min(1).max(31)
});

export const accountSchema = z.discriminatedUnion('type', [
  debitAccountSchema,
  creditAccountSchema,
  cashAccountSchema
]);



export type AccountSchema = z.infer<typeof accountSchema>;
