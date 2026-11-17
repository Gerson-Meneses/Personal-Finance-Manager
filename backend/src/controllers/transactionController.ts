import { Context } from "hono";
import dayjs from "dayjs";
import { TransactionService } from "../services/transactionService";
import { TransactionSchema, UpdateTransactionSchema } from "../schemas/transaction.schema";
import { TransferSchema } from "../schemas/transfers.schema";
import { UuidSchema } from "../schemas/uuid.schema";
import { ApiPaginated } from "../typesResponseHttp/apiResponses";
import { Transaction } from "../entities/Transaction.entity";
import { paginated } from "../helpers/responses";
import { TransactionQuerySchema } from "../schemas/querysTransaction.schema";
import { TransactionResponse, TransactionStatsResponse } from "../ResponseInterfaces/TransactionInterface";
import { buildCsv, csvFileName, type CsvValue } from "../utils/csv";
import { money } from "../utils/normalizarMoney";

const categoryService = new TransactionService();

const TYPE_LABEL: Record<string, string> = {
    INCOME: "Ingreso",
    EXPENSE: "Gasto",
    TRANSFER: "Transferencia",
    CREDIT_PAYMENT: "Pago de tarjeta",
};

export const getAllTransactionsByUser = async (c: Context,userId: UuidSchema, filters: TransactionQuerySchema) => {
    const result = await categoryService.getTransactions(userId,filters);
    return c.json<ApiPaginated<TransactionResponse>>(paginated(result.items, result.total, result.page, result.limit), 200)
}

export const getTransactionsStats = async (c: Context, userId: UuidSchema, filters: TransactionQuerySchema) => {
    const result = await categoryService.getTransactionsStats(userId, filters);
    return c.json<TransactionStatsResponse>(result, 200)
}

export const exportTransactions = async (c: Context, userId: UuidSchema, filters: TransactionQuerySchema) => {
    const transactions = await categoryService.exportTransactions(userId, filters);
    const rows: CsvValue[][] = [
        ["Fecha", "Hora", "Nombre", "Tipo", "Categoría", "Cuenta", "Cuenta relacionada", "Monto", "Impacto", "Establecimiento", "Dirección", "Productos", "Etiquetas", "Divisiones", "Descripción"],
        ...transactions.map((transaction) => [
            transaction.date,
            transaction.time ?? "",
            transaction.name,
            TYPE_LABEL[transaction.type] ?? transaction.type,
            transaction.category?.name ?? "",
            transaction.account?.name ?? "",
            transaction.relatedAccount?.name ?? "",
            money(transaction.amount).toFixed(2),
            transaction.reportingImpact === "CASHFLOW_ONLY" ? "Solo flujo" : "Reportable",
            transaction.merchantName ?? "",
            transaction.merchantAddress ?? "",
            transaction.items
                ?.map((item) => `${item.name} x${Number(item.quantity)} @ ${money(item.unitPrice).toFixed(2)}`)
                .join(" | ") ?? "",
            transaction.tags?.map((tag) => tag.name).join(", ") ?? "",
            transaction.splits
                ?.map((split) => `${split.category?.name ?? "Sin categoría"}: ${money(split.amount).toFixed(2)}`)
                .join(" | ") ?? "",
            transaction.description ?? "",
        ]),
    ];

    const range = filters.from || filters.to
        ? `${filters.from ?? "inicio"}_${filters.to ?? "hoy"}`
        : dayjs().format("YYYY-MM-DD");
    const filename = csvFileName("transacciones", range);

    c.header("Content-Type", "text/csv; charset=utf-8");
    c.header("Content-Disposition", `attachment; filename="${filename}"`);
    return c.body(buildCsv(rows), 200);
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

export const updateTransaction = async (c: Context, userId: UuidSchema, transactionId: UuidSchema, updateData: UpdateTransactionSchema) => {
    const updatedTransaction = await categoryService.updateTransaction(transactionId, userId, updateData)
    return c.json(updatedTransaction, 200)
}

export const transferTransaction = async (c: Context, userId: UuidSchema, transaction: TransferSchema) => {
    const newTransfer = await categoryService.createTransfer(transaction, userId)
    return c.json(newTransfer, 201)
}

export const deleteTransaction = async (c: Context, userId: UuidSchema, transactionId: UuidSchema) => {
    const data = await categoryService.deleteTransaction(transactionId, userId)
    return c.json(204)
}
