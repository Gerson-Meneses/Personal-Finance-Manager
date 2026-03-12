import { apiFetch } from "../../shared/api";
import type { Data } from "../../shared/dataApiInterface";
import type { Account } from "./types";

export const getAccounts = () =>
  apiFetch<Data<Account>>("/accounts");

export const createAccount = (data: Omit<Account, "id">) =>
  apiFetch<Account>("/accounts", {
    method: "POST",
    body: JSON.stringify(data),
  });
