import { Category } from "../entities/Category.entity";
import { CategoryResponse } from "../ResponseInterfaces/CategoryResponse";
import { toTransactionResponse } from "./TransactionMapper";

export const toCategoryResponse = (cat: Category): CategoryResponse => {

    const { id, name, type, color, isBase, visible, icon, parentCategoryId, transactions, reccurentTransactions } = cat

    let categoryResponse: CategoryResponse = {
        id,
        name,
        type,
        color,
        isBase,
        isVisible: visible,
        parentCategoryId: parentCategoryId ?? null
    }

    if (icon) categoryResponse.icon = icon

    if (transactions) categoryResponse.transactions = transactions.map(tx => toTransactionResponse(tx))

    /*   if (reccurentTransactions) categoryResponse.reccurentTransactions = reccurentTransactions.map(tx => toTransactionRecurrentResponse(tx)) */


    return categoryResponse
}