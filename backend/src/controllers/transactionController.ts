import { Context } from "hono";
import { TransactionService } from "../services/transactionService";
import { TransactionSchema } from "../schemas/transaction.schema";
import { TransferSchema } from "../schemas/transfers.schema";
import { UuidSchema } from "../schemas/uuid.schema";
import { ApiPaginated } from "../typesResponseHttp/apiResponses";
import { Transaction } from "../entities/Transaction.entity";
import { paginated } from "../helpers/responses";
import { TransactionQuerySchema } from "../schemas/querysTransaction.schema";

const categoryService = new TransactionService();

export const getAllTransactionsByUser = async (c: Context,userId: UuidSchema, filters: TransactionQuerySchema) => {
    const result = await categoryService.getTransactions(userId,filters);
    return c.json<ApiPaginated<Transaction>>(paginated(result.items, result.total, result.page, result.limit), 200)
}

export const
    getTransactionById = async (c: Context, userId: string, transactionId: UuidSchema) => {
        const transaction = await categoryService.getTransactionById(transactionId, userId)
        return c.json(transaction)
    }

export const createTransaction = async (c: Context, userId: UuidSchema, transaction: TransactionSchema) => {
    const newTransaction = await categoryService.createTransaction(transaction, userId)
    return c.json(newTransaction, 201)
}

export const transferTransaction = async (c: Context, userId: UuidSchema, transaction: TransferSchema) => {
    const newTransfer = await categoryService.createTransfer(transaction, userId)
    return c.json(newTransfer, 201)
}

export const deleteTransaction = async (c: Context, userId: UuidSchema, transactionId: UuidSchema) => {
    const data = await categoryService.deleteTransaction(transactionId, userId)
    return c.json(204)
}
