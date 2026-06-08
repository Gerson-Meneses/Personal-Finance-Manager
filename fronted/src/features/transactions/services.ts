import { apiFetch } from "../../shared/api";
import type { Data } from "../../shared/dataApiInterface";
import type { Transaction, TransactionOutput, TransactionQuerySchemaOutput, UpdateTransactionOutput } from "./types";

export const getTransactions = async (query?: TransactionQuerySchemaOutput): Promise<Data<Transaction>> => {
  const searchParams = query ? `?${new URLSearchParams(query as any).toString()}` : "";
  return await apiFetch<Data<Transaction>>(`/transaction${searchParams}`);
};

export const getTransactionById = async (id: string): Promise<Transaction> => {
  return await apiFetch<Transaction>(`/transaction/${id}`);
};

export const createTransaction = async (data: TransactionOutput): Promise<Transaction> => {
  return await apiFetch<Transaction>("/transaction", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const updateTransaction = async (id: string, data:UpdateTransactionOutput): Promise<Transaction> => {
  return await apiFetch<Transaction>(`/transaction/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
};

export const deleteTransaction = async (id: string): Promise<void> => {
  await apiFetch<void>(`/transaction/${id}`, {
    method: "DELETE",
  });
};