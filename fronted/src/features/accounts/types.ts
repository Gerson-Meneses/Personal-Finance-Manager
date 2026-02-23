export interface Account {
    id: string,
    name: string,
    type: "CASH" | "CREDIT" | "DEBIT" ,
    balance: number,
    color: string,
    icon: string,
}

export interface DataAccount {
    message: string,
    accounts: Account[]
}