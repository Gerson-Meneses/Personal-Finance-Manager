import { apiFetch } from "../../shared/api";
import type { DataTransaction, Transaction } from "./types";

export const getTransactions = () =>
  apiFetch<DataTransaction>("/transaction");

export const createTransaction = (data: Omit<Transaction, "id">) =>
  apiFetch<Transaction>("/transaction", {
    method: "POST",
    body: JSON.stringify(data),
  });
