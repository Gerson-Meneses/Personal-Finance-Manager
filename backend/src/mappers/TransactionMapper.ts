import dayjs from "dayjs";
import { Transaction } from "../entities/Transaction.entity";
import { TransactionResponse } from "../ResponseInterfaces/TransactionInterface";
import { toAccountResponse } from "./AccountMapper";
import { money } from "../utils/normalizarMoney";
import { toCategoryResponse } from "./CategoryMapper";
import { toLoanResponse } from "./LoansMapper";

export interface TransactionMapperProp {
    moneyAmount?: boolean
}

export const toTransactionResponse = (transaction: Transaction, { moneyAmount = true }: TransactionMapperProp = {}): TransactionResponse => {
    const { id, name, type, amount, date, account, time, description, postedAt, isRecurrent, relatedAccount, category, loan } = transaction

    let transactionResponse: TransactionResponse = {
        id,
        name,
        type,
        amount: moneyAmount ? money(amount) : amount,
        date,
        isRecurrent
    }

    if (time) transactionResponse.time = time
    if (description) transactionResponse.description = description
    if (postedAt) transactionResponse.postedAt = postedAt


    if (account) transactionResponse.account = toAccountResponse(account)
    if (relatedAccount) transactionResponse.relatedAccount = toAccountResponse(relatedAccount)

    if (category) transactionResponse.category = toCategoryResponse(category)


    if (loan) transactionResponse.loan = toLoanResponse(loan)

    return transactionResponse
}