export type TransactionTypeBase = "INCOME" | "EXPENSE" 


export interface Category {
    id: string,
    name: string,
    type: TransactionTypeBase
    color: string,
    icon: string,
    visible: boolean,
    isBase: boolean
}

export interface CreateCategoryDTO {
  name: string
  type: TransactionTypeBase
  color?: string
  icon?: string
}