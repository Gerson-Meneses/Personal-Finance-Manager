export interface Account {
    id: string,
    name: string,
    type: AccountType,
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
    type: AccountType,
    color?: string,
    icon?: string,
    creditLimit?: number,
    billingCloseDay?: number,
    paymentDueDay?: number,
    overdraft?: number
}

export interface UpdateAccountDTO {
    accountId: string,
    name?: string,
    type?: AccountType,
    color?: string,
    icon?: string,
    creditLimit?: number,   
    billingCloseDay?: number,
    paymentDueDay?: number,
    overdraft?: number
}

export type AccountType = "CASH" | "CREDIT" | "DEBIT"