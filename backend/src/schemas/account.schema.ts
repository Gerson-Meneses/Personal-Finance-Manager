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
    .number({ message: "El limite de credito es requerido y debe ser un numero" })
    .positive({ message: "El limite de credito debe ser mayor a 0" })
    .transform(n => n * 100),

  billingCloseDay: z
    .number({ message: "El dia de cierre debe ser un numero" })
    .int({ message: "El dia de cierre debe ser un numero entero" })
    .min(1, { message: "El dia debe estar entre 1 y 31" })
    .max(31, { message: "El dia debe estar entre 1 y 31" }),

  paymentDueDay: z
    .number({ message: "El dia de pago debe ser un numero" })
    .int({ message: "El dia de pago debe ser un numero entero" })
    .min(1, { message: "El dia debe estar entre 1 y 31" })
    .max(31, { message: "El dia debe estar entre 1 y 31" }),

  overdraft: z
    .number({ message: "El sobregiro debe ser un numero" })
    .nonnegative({ message: "El sobregiro no puede ser negativo" })
    .max(100, { message: "El sobregiro no puede ser mayor al 100%" })
    .nullish()
    .transform(numberNullableToUndefined),

  tea: z
    .number({ message: "La TEA debe ser un numero" })
    .nonnegative({ message: "La TEA no puede ser negativa" })
    .max(1000, { message: "La TEA parece demasiado alta" })
    .nullish()
    .transform(numberNullableToUndefined),

  tcea: z
    .number({ message: "La TCEA debe ser un numero" })
    .nonnegative({ message: "La TCEA no puede ser negativa" })
    .max(1000, { message: "La TCEA parece demasiado alta" })
    .nullish()
    .transform(numberNullableToUndefined),

  desgravamenRate: z
    .number({ message: "El seguro de desgravamen debe ser un numero" })
    .nonnegative({ message: "El seguro no puede ser negativo" })
    .max(100, { message: "El seguro no puede ser mayor al 100%" })
    .nullish()
    .transform(numberNullableToUndefined),

  desgravamenMaxAmount: z
    .number({ message: "El tope del seguro debe ser un numero" })
    .nonnegative({ message: "El tope del seguro no puede ser negativo" })
    .nullish()
    .transform((value) => (value == null ? undefined : Math.round(value * 100))),

  currency: z
    .string({ message: "La moneda debe ser texto" })
    .trim()
    .length(3, { message: "La moneda debe tener 3 letras" })
    .nullish()
    .transform(nullableToUndefined),

  issuer: z
    .string({ message: "El banco emisor debe ser texto" })
    .trim()
    .max(100, { message: "El banco emisor no puede exceder 100 caracteres" })
    .nullish()
    .transform(nullableToUndefined),

  brand: z
    .string({ message: "La marca debe ser texto" })
    .trim()
    .max(30, { message: "La marca no puede exceder 30 caracteres" })
    .nullish()
    .transform(nullableToUndefined),

  last4: z
    .string({ message: "Los ultimos 4 digitos deben ser texto" })
    .trim()
    .regex(/^\d{4}$/, { message: "Deben ser exactamente 4 digitos" })
    .nullish()
    .transform(nullableToUndefined),

  holderName: z
    .string({ message: "El titular debe ser texto" })
    .trim()
    .max(150, { message: "El titular no puede exceder 150 caracteres" })
    .nullish()
    .transform(nullableToUndefined),
});

// Simplificamos la union para evitar errores de overload
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
  tea: creditAccountSchema.shape.tea.optional(),
  tcea: creditAccountSchema.shape.tcea.optional(),
  desgravamenRate: creditAccountSchema.shape.desgravamenRate.optional(),
  desgravamenMaxAmount: creditAccountSchema.shape.desgravamenMaxAmount.optional(),
  currency: creditAccountSchema.shape.currency.optional(),
  issuer: creditAccountSchema.shape.issuer.optional(),
  brand: creditAccountSchema.shape.brand.optional(),
  last4: creditAccountSchema.shape.last4.optional(),
  holderName: creditAccountSchema.shape.holderName.optional(),
});


export type UpdateAccountSchema = z.infer<typeof updateAccountSchema>;
