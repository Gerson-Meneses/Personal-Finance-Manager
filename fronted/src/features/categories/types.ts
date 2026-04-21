import type { TransactionType } from "../transactions/types"

export type TransactionTypeBase = "INCOME" | "EXPENSE" 


export interface Category {
    id: string,
    name: string,
    type: TransactionType
    color: string,
    icon: string,
    visible: boolean,
    isBase: boolean
}

export interface CreateCategoryDTO {
  name: string
  type: TransactionType
  color?: string
  icon?: string
}