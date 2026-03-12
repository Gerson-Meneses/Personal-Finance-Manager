export interface Category {
    id: string,
    name: string,
    type: "INCOME" | "EXPENSE",
    color: string,
    icon: string,
    visible: boolean,
    isBase: boolean
}

export interface CreateCategoryDTO {
  name: string
  type: "INCOME" | "EXPENSE"
  color?: string
  icon?: string
}