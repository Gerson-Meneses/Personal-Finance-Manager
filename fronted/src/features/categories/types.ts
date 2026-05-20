import type { Transaction, TransactionType } from "../transactions/types"

export type TransactionTypeBase = "INCOME" | "EXPENSE"


export interface Category {
  id: string,
  name: string,
  type: TransactionType
  color: string,
  icon?: string,
  isVisible: boolean,
  isBase: boolean
  transactions?: Transaction[]
  //reccurentTransactions?: ReccurentTransaction[];
}

export interface CreateCategoryDTO {
  name: string
  type: TransactionType
  color?: string
  icon?: string
}