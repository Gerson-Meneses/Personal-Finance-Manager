export interface Category {
    id: string,
    name: string,
    type: "INCOME" | "EXPENSE",
    color: string,
    icon: string,
    visible: boolean,
    isBase: boolean
}

export interface DataCategory {
    message:string,
    categories: Category[]
}