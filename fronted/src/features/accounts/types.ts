export interface Account {
    id: string,
    name: string,
    type: "CASH" | "CREDIT" | "DEBIT",
    balance: number,
    color: string,
    icon: string,
    creditLimit?: number,
    billingCloseDay?: number,
    paymentDueDay?: number,
    overdraft?: number
}

export interface CreateAccountDTO {
    name: string,
    type: "CASH" | "CREDIT" | "DEBIT",
    balance: number,
    color?: string,
    icon?: string,
    creditLimit?: number,
    billingCloseDay?: number,
    paymentDueDay?: number,
    overdraft?: number
}

export type AccountType = "CASH" | "CREDIT" | "DEBIT"