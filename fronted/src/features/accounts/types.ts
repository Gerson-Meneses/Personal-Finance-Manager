export interface Account {
    id: string,
    name: string,
    type: "CASH" | "CREDIT" | "DEBIT" ,
    balance: number,
    color: string,
    icon: string,
}

export interface CreateAccountDTO {
    name: string,
    type: "CASH" | "CREDIT" | "DEBIT",
    balance: number,
    color?: string,
    icon?: string,
}

export type AccountType = "CASH" | "CREDIT" | "DEBIT"