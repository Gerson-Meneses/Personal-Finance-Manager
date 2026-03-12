import { apiFetch } from "../../shared/api";
import type { Data } from "../../shared/dataApiInterface";
import type { Transaction } from "./types";

export const getTransactions = () =>
  apiFetch<Data<Transaction>>("/transaction");

export const createTransaction = (data: Omit<Transaction, "id">) =>
  apiFetch<Transaction>("/transaction", {
    method: "POST",
    body: JSON.stringify(data),
  });
