import { Category } from "../entities/Category.entity";
import { CategoryResponse } from "../ResponseInterfaces/CategoryResponse";
import { toTransactionResponse } from "./TransactionMapper";

export const toCategoryResponse = (cat: Category): CategoryResponse => {

    const { id, name, type, color, isBase, visible, icon, transactions, reccurentTransactions } = cat

    let categoryResponse: CategoryResponse = {
        id,
        name,
        type,
        color,
        isBase,
        isVisible: visible
    }

    if (icon) categoryResponse.icon = icon

    if (transactions) categoryResponse.transactions = transactions.map(tx => toTransactionResponse(tx))

    /*   if (reccurentTransactions) categoryResponse.reccurentTransactions = reccurentTransactions.map(tx => toTransactionRecurrentResponse(tx)) */


    return categoryResponse
}