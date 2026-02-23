import { apiFetch } from "../../shared/api";
import type { DataAccount, Account } from "./types";

export const getAccounts = () =>
  apiFetch<DataAccount>("/accounts");

export const createAccount = (data: Omit<Account, "id">) =>
  apiFetch<Account>("/accounts", {
    method: "POST",
    body: JSON.stringify(data),
  });
