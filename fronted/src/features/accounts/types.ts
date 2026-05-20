import type { Transaction } from "../transactions/types"

export interface BaseAccount {
    id: string
    name: string
    icon: string
    color: string
    type: AccountType,
}

export interface Account extends BaseAccount {
    balance: number,
    creditLimit?: number,
    billingCloseDay?: number,
    paymentDueDay?: number,
    overdraft?: number,
    transactions?: Transaction[]
    /* reccurentTransactions?: ReccurentTransaction[]; */
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