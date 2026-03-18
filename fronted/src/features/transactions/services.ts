import { apiFetch } from "../../shared/api";
import type { Data } from "../../shared/dataApiInterface";
import type { Transaction, TransactionQuerySchema } from "./types";

export const getTransactions = async (query?: TransactionQuerySchema) => {
  
  const searchParams = new URLSearchParams(query as Record<string, string>);

  return await apiFetch<Data<Transaction>>(`/transaction?${searchParams}`);
}

export const createTransaction = (data: Omit<Transaction, "id">) =>
  apiFetch<Transaction>("/transaction", {
    method: "POST",
    body: JSON.stringify(data),
  });
