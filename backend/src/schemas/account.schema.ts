import { object, z } from 'zod';
import { TypeAccount } from '../utils/Enums';


const baseAccount = {
  name: z.string().min(2).max(99).toUpperCase(),
  balance: z.number().nonnegative().optional(),
};

const debitAccountSchema = z.object({
  ...baseAccount,
  type: z.literal(TypeAccount.DEBIT)
});

const creditAccountSchema = z.object({
  ...baseAccount,
  type: z.literal(TypeAccount.CREDIT),
  creditLimit: z.number().positive(),
  billingCloseDay: z.number().int().min(1).max(31),
  paymentDueDay: z.number().int().min(1).max(31),
  overdraft: z.number().positive().max(100).optional(),
});

export const accountSchema = z.discriminatedUnion('type', [
  debitAccountSchema,
  creditAccountSchema
], { message: "El campo 'type' es requerido y debe ser uno de los siguientes valores: 'DEBIT', 'CREDIT' " });

export type AccountSchema = z.infer<typeof accountSchema>;

export const updateAccountSchema = z.object({
  name: z.string().min(2).max(99).toUpperCase().optional(),
})

export type UpdateAccountSchema = z.infer<typeof updateAccountSchema>;