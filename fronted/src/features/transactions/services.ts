import { apiFetch } from "../../shared/api";
import type { Data } from "../../shared/dataApiInterface";
import type { Transaction, TransactionOutput, TransactionQuerySchemaOutput, TransactionStats, UpdateTransactionOutput } from "./types";

const toSearchParams = (query?: TransactionQuerySchemaOutput) => {
  if (!query) return "";
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  });
  return `?${params.toString()}`;
};

export const getTransactions = async (query?: TransactionQuerySchemaOutput): Promise<Data<Transaction>> => {
  return await apiFetch<Data<Transaction>>(`/transaction${toSearchParams(query)}`);
};

export const getTransactionStats = async (query?: TransactionQuerySchemaOutput): Promise<TransactionStats> => {
  return await apiFetch<TransactionStats>(`/transaction/stats${toSearchParams(query)}`);
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