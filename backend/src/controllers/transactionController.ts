import { Context } from "hono";
import { TransactionService } from "../services/transactionService";
import { TransactionSchema } from "../schemas/transaction.schema";
import { TransferSchema } from "../schemas/transfers.schema";
import { UuidSchema } from "../schemas/uuid.schema";
import { TransactionFilters } from "../types";

const categoryService = new TransactionService();

export const getAllTransactionsByUser = async (c: Context, filters:TransactionFilters ) => {
    const transactions = await categoryService.getTransactions(filters);
    return c.json({ message: 'Transactions get succesfull', transactions})
}

export const 
getTransactionById = async (c: Context, userId: string, transactionId: UuidSchema) => {
    const transaction = await categoryService.getTransactionById(transactionId, userId)
    return c.json({ message: "Transaction get succesfull", transaction })
}

export const createTransaction = async (c: Context, userId: UuidSchema, transaction: TransactionSchema) => {
    const newTransaction = await categoryService.createTransaction(transaction, userId)
    return c.json({ message: `Transaction created succesfull`, newTransaction })
}

export const transferTransaction = async (c: Context, userId: UuidSchema, transaction: TransferSchema) => {
    const newTransfer = await categoryService.createTransfer(transaction, userId)
    return c.json({ message: "Transfer created succesfull", newTransfer })
}

export const deleteTransaction = async (c: Context, userId: UuidSchema, transactionId: UuidSchema) => {
    const data = await categoryService.deleteTransaction(transactionId, userId)
    return c.json({ message: "Transaction deleted succesfull", data })
}
