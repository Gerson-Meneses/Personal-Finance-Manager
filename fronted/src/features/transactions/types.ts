import z from "zod";
import type { Account } from "../accounts/types";
import type { Category } from "../categories/types";
import type { Loan } from "../loans/types";
import { amountSchema, dateSchema, descriptionSchema, nameSchema, numberSchema, stringSchema, timeSchema, uuidSchema } from "../../shared/Schemas/Base.schema";
import type { LoanPayment } from "../LoanPayments/types";

export const TransactionTypeValues = ["INCOME", "EXPENSE", "CREDIT_PAYMENT", "TRANSFER"] as const;
export type TransactionType = typeof TransactionTypeValues[number]

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

export const TransactionSchema = z.object({
  name: nameSchema(),
  type: z.enum(TransactionTypeValues),
  amount: amountSchema() as z.ZodType<number>,
  date: dateSchema(),
  time: timeSchema().optional(),
  description: descriptionSchema().optional(),
  accountId: uuidSchema(),
  categoryId: uuidSchema()
})

export type TransactionInput = z.input<typeof TransactionSchema>
export type TransactionOutput = z.output<typeof TransactionSchema>

export const UpdateTransactionSchema = z.object({
  transactionId: uuidSchema(),
  ...TransactionSchema.shape,
})

export type UpdateTransactionInput = z.input<typeof UpdateTransactionSchema>
export type UpdateTransactionOutput = z.output<typeof UpdateTransactionSchema>


export const ORDER_VALUES = ["ASC", "DESC"] as const;
export type Order_Type = typeof ORDER_VALUES[number]

export const TransactionQuerySchema = z.object({
  type: z.enum(TransactionTypeValues).optional(),
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

export type TransactionQuerySchemaInput = z.input<typeof TransactionQuerySchema>
export type TransactionQuerySchemaOutput = z.output<typeof TransactionQuerySchema>



export const defaultTransactionsQueryFilters: TransactionQuerySchemaOutput = {
  order: 'DESC',
  page: 1,
  limit: 20
}