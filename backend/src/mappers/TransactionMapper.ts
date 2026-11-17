import { Transaction } from "../entities/Transaction.entity";
import {
    TransactionAttachmentResponse,
    TransactionItemResponse,
    TransactionResponse,
    TransactionSplitResponse,
} from "../ResponseInterfaces/TransactionInterface";
import { toAccountResponse } from "./AccountMapper";
import { money } from "../utils/normalizarMoney";
import { toCategoryResponse } from "./CategoryMapper";
import { toLoanResponse } from "./LoansMapper";
import { toTagResponse } from "./TagMapper";

export interface TransactionMapperProp {
    moneyAmount?: boolean
}

export const toTransactionResponse = (transaction: Transaction, { moneyAmount = true }: TransactionMapperProp = {}): TransactionResponse => {
    const {
        id,
        name,
        type,
        amount,
        date,
        account,
        time,
        description,
        postedAt,
        isRecurrent,
        relatedAccount,
        category,
        loan,
        tags,
        splits,
        items,
        attachments,
        merchantName,
        merchantAddress,
        merchantRuc,
    } = transaction

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
    if (merchantName) transactionResponse.merchantName = merchantName
    if (merchantAddress) transactionResponse.merchantAddress = merchantAddress
    if (merchantRuc) transactionResponse.merchantRuc = merchantRuc


    if (account) transactionResponse.account = toAccountResponse(account)
    if (relatedAccount) transactionResponse.relatedAccount = toAccountResponse(relatedAccount)

    if (category) transactionResponse.category = toCategoryResponse(category)


    if (loan) transactionResponse.loan = toLoanResponse(loan)

    if (tags) transactionResponse.tags = tags.map((tag) => toTagResponse(tag))

    if (splits) {
        transactionResponse.splits = splits.map((split): TransactionSplitResponse => {
            const splitResponse: TransactionSplitResponse = {
                id: split.id,
                amount: moneyAmount ? money(split.amount) : split.amount,
            }

            if (split.description) splitResponse.description = split.description
            if (split.category) splitResponse.category = toCategoryResponse(split.category)
            if (split.tags) splitResponse.tags = split.tags.map((tag) => toTagResponse(tag))

            return splitResponse
        })
    }

    if (items) {
        transactionResponse.items = items.map(
            (item): TransactionItemResponse => ({
                id: item.id,
                name: item.name,
                quantity: Number(item.quantity),
                unitPrice: moneyAmount ? money(item.unitPrice) : item.unitPrice,
                total: moneyAmount ? money(item.total) : item.total,
            })
        )
    }

    if (attachments) {
        transactionResponse.attachments = attachments.map(
            (attachment): TransactionAttachmentResponse => ({
                id: attachment.id,
                fileName: attachment.fileName,
                mimeType: attachment.mimeType,
                size: attachment.size,
                createdAt: attachment.createdAt,
            })
        )
    }

    return transactionResponse
}
