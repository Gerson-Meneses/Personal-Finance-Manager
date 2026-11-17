import z from "zod";
import type { Account } from "../accounts/types";
import type { Category } from "../categories/types";
import type { Loan } from "../loans/types";
import type { Tag } from "../tags/types";
import { amountSchema, dateSchema, descriptionSchema, nameSchema, numberSchema, stringSchema, timeSchema, uuidSchema } from "../../shared/Schemas/Base.schema";

export const TransactionTypeValues = ["INCOME", "EXPENSE", "CREDIT_PAYMENT", "TRANSFER"] as const;
export type TransactionType = typeof TransactionTypeValues[number]

export interface TransactionSplit {
  id: string;
  amount: number;
  description?: string;
  category?: Category;
  tags?: Tag[];
}

export interface TransactionAttachment {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
  createdAt?: string;
}

export interface PurchaseItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Transaction {
  id: string;
  name: string;
  type: TransactionType;
  amount: number;
  date: string;
  time?: string;
  postedAt?: Date;
  description?: string;
  merchantName?: string;
  merchantAddress?: string;
  merchantRuc?: string;
  isRecurrent: boolean;
  account?: Account,
  relatedAccount?: Account,
  category?: Category,
  loan?: Loan,
  tags?: Tag[],
  splits?: TransactionSplit[],
  items?: PurchaseItem[],
  attachments?: TransactionAttachment[]
}

export const TransactionItemFormSchema = z.object({
  name: z
    .string({ message: "El nombre del producto es requerido" })
    .trim()
    .min(2, { message: "El nombre debe tener al menos 2 caracteres" })
    .max(255, { message: "El nombre no puede exceder los 255 caracteres" }),
  quantity: z.coerce
    .number({ message: "La cantidad debe ser numérica" })
    .positive({ message: "La cantidad debe ser mayor a 0" }),
  unitPrice: z.coerce
    .number({ message: "El precio debe ser numérico" })
    .nonnegative({ message: "El precio no puede ser negativo" }),
})

export type TransactionItemFormInput = z.input<typeof TransactionItemFormSchema>
export type TransactionItemFormOutput = z.output<typeof TransactionItemFormSchema>

export const TransactionSplitFormSchema = z.object({
  categoryId: uuidSchema("Categoría de la división"),
  amount: amountSchema("Monto de la división"),
  description: descriptionSchema("Descripción de la división").optional(),
  tagIds: z.array(uuidSchema("Etiqueta")).optional(),
})

export type TransactionSplitFormInput = z.input<typeof TransactionSplitFormSchema>
export type TransactionSplitFormOutput = z.output<typeof TransactionSplitFormSchema>

export interface TransactionStats {
  count: number;
  income: number;
  expense: number;
  net: number;
  transfers: number;
  creditPayments: number;
}

export const TransactionSchema = z.object({
  name: nameSchema(),
  type: z.enum(TransactionTypeValues),
  amount: amountSchema() as z.ZodType<number>,
  date: dateSchema(),
  time: timeSchema().optional(),
  description: descriptionSchema().optional(),
  accountId: uuidSchema(),
  // "": el usuario decidió dividir la transacción y no usar una categoría principal.
  categoryId: z.union([z.literal(""), uuidSchema()]).optional(),
  tagIds: z.array(uuidSchema("Etiqueta")).optional(),
  splits: z.array(TransactionSplitFormSchema).optional(),
  merchantName: z.string().trim().max(150).optional(),
  merchantAddress: z.string().trim().max(255).optional(),
  merchantRuc: z
    .union([z.literal(""), z.string().regex(/^\d{11}$/, "El RUC debe tener 11 dígitos")])
    .optional(),
  items: z.array(TransactionItemFormSchema).optional(),
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
  tagId: uuidSchema("Id de Etiqueta").optional(),
  date: dateSchema("Fecha exacta").optional(),
  from: dateSchema("Fecha minima").optional(),
  to: dateSchema("Fecha maxima").optional(),
  amount: amountSchema().optional(),
  minAmount: amountSchema("Monto minimo").optional(),
  maxAmount: amountSchema("Monto maximo").optional(),
  relatedAccountId: uuidSchema("Id de cuenta relacionada").optional(),
  page: numberSchema("Pagina").optional(),
  limit: numberSchema("Limite").optional(),
  orderBy: z.enum(["date", "amount", "name", "createdAt"]).optional(),
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