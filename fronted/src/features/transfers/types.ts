export interface CreateTransferDto {
    amount: number
    date: string
    time: string
    fromAccount: string
    toAccount: string
    description?: string
}