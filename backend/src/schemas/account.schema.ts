import { z } from 'zod';
import { TypeAccount } from '../utils/Enums';

const nullableToUndefined = (val: string | null | undefined) => val ?? undefined;
const numberNullableToUndefined = (val: number | null | undefined) => val ?? undefined;

const baseAccount = {
  name: z
    .string({ message: "El nombre es requerido y debe ser texto" })
    .trim()
    .min(3, { message: "El nombre debe tener al menos 3 caracteres" })
    .max(99, { message: "El nombre no puede exceder los 99 caracteres" })
    .toUpperCase(),

  icon: z
    .string({ message: "El icono debe ser una cadena de texto" })
    .trim()
    .nullish()
    .transform(nullableToUndefined),

  color: z
    .string({ message: "El color debe ser una cadena de texto" })
    .trim()
    .nullish()
    .transform(nullableToUndefined),
};

const debitAccountSchema = z.object({
  ...baseAccount,
  type: z.literal(TypeAccount.DEBIT)
});

const creditAccountSchema = z.object({
  ...baseAccount,
  type: z.literal(TypeAccount.CREDIT),

  creditLimit: z
    .number({ message: "El límite de crédito es requerido y debe ser un número" })
    .positive({ message: "El límite de crédito debe ser mayor a 0" })
    .transform(n => n * 100),

  billingCloseDay: z
    .number({ message: "El día de cierre debe ser un número" })
    .int({ message: "El día de cierre debe ser un número entero" })
    .min(1, { message: "El día debe estar entre 1 y 28" })
    .max(28, { message: "El día debe estar entre 1 y 28" }),

  paymentDueDay: z
    .number({ message: "El día de pago debe ser un número" })
    .int({ message: "El día de pago debe ser un número entero" })
    .min(1, { message: "El día debe estar entre 1 y 28" })
    .max(28, { message: "El día debe estar entre 1 y 28" }),

  overdraft: z
    .number({ message: "El sobregiro debe ser un número" })
    .nonnegative({ message: "El sobregiro no puede ser negativo" })
    .max(100, { message: "El sobregiro no puede ser mayor al 100%" })
    .nullish()
    .transform(numberNullableToUndefined),
});

// Simplificamos la unión para evitar errores de overload
export const accountSchema = z.discriminatedUnion('type', [
  debitAccountSchema,
  creditAccountSchema
]);

export type AccountSchema = z.infer<typeof accountSchema>;

export const updateAccountSchema = z.object({
  name: baseAccount.name.optional(),
  icon: baseAccount.icon, 
  color: baseAccount.color, 
  creditLimit: creditAccountSchema.shape.creditLimit.optional(),
  billingCloseDay: creditAccountSchema.shape.billingCloseDay.optional(),
  paymentDueDay: creditAccountSchema.shape.paymentDueDay.optional(),
  overdraft: creditAccountSchema.shape.overdraft.optional(),
});


export type UpdateAccountSchema = z.infer<typeof updateAccountSchema>;
