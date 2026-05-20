import { User } from "../entities/User.entity"
import { TypeTransaction } from "../utils/Enums"
import { TransactionResponse } from "./TransactionInterface"

export interface CategoryResponse {
    id: string
    name: string
    type: TypeTransaction
    color: string
    icon?: string
    isBase: boolean
    isVisible: boolean
    transactions?: TransactionResponse[]
    reccurentTransactions?: TransactionResponse[]
}