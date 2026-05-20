import z from "zod";
import type { Account } from "../accounts/types";
import type { Category } from "../categories/types";
import type { Loan, LoanPayment } from "../loans/types";
import { amountSchema, dateSchema, descriptionSchema, nameSchema, numberSchema, stringSchema, timeSchema, uuidSchema } from "../../shared/Schemas/Base.schema";

export const TRANSACTION_TYPES = ["INCOME", "EXPENSE", "CREDIT_PAYMENT", "TRANSFER"] as const;
export type TransactionType = typeof TRANSACTION_TYPES[number]

export interface Transaction {
  id: string;
  name: string;
  type: TransactionType;
  amount: number;
  date: string;
  time?: string;
  postedAt?: Date;
  description?: string;
  isRecurrent: boolean;
  account?: Account,
  relatedAccount?: Account,
  category?: Category,
  loan?: Loan,
  loanPayment?: LoanPayment
}

export const transactionSchema = z.object({
  name: nameSchema(),
  type: z.enum(TRANSACTION_TYPES),
  amount: amountSchema() as z.ZodType<number>,
  date: dateSchema(),
  time: timeSchema().optional(),
  description: descriptionSchema().optional(),
  accountId: uuidSchema(),
  categoryId: uuidSchema()
})

export type TransactionFormInput = z.input<typeof transactionSchema>
export type TransactionDTO = z.output<typeof transactionSchema>

export const updateTransactionSchema = z.object({
  transactionId: uuidSchema(),
  ...transactionSchema.shape,
})

export type UpdateTransactionDTO = z.output<typeof updateTransactionSchema>
export type UpdateTransactionFormInput = z.input<typeof updateTransactionSchema>


export const ORDER_VALUES = ["ASC", "DESC"] as const;
export type Order_Type = typeof ORDER_VALUES

export const transactionQuerySchema = z.object({
  type: z.enum(TRANSACTION_TYPES).optional(),
  accountId: uuidSchema("Id de Cuenta").optional(),
  categoryId: uuidSchema("Id de Categoria").optional(),
  date: dateSchema("Fecha exacta").optional(),
  from: dateSchema("Fecha minima").optional(),
  to: dateSchema("Fecha maxima").optional(),
  amount: amountSchema().optional(),
  minAmount: amountSchema("Monto minimo").optional(),
  maxAmount: amountSchema("Monto maximo").optional(),
  relatedAccountId: uuidSchema("Id de cuenta relacionada").optional(),
  page: numberSchema("Pagina").optional(),
  limit: numberSchema("Limite").optional(),
  order: z.enum(ORDER_VALUES).optional(),
  search: stringSchema("Busqueda").optional()
})

export type TransactionQuerySchema = z.infer<typeof transactionQuerySchema>