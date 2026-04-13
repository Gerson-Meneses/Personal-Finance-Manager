import { apiFetch } from "../../shared/api";
import type { Data } from "../../shared/dataApiInterface";
import type { Account, CreateAccountDTO } from "./types";

const BASE_PATH = "/accounts";

export const getAccounts = () =>
  apiFetch<Data<Account>>(BASE_PATH);

export const getAccountById = (id: string) =>
  apiFetch<Account>(`${BASE_PATH}/${id}`);

export const createAccount = (data: CreateAccountDTO) =>
  apiFetch<Account>(BASE_PATH, {
    method: "POST",
    body: data, 
  });

export const deleteAccount = (id: string) =>
  apiFetch<void>(`${BASE_PATH}/${id}`, {
    method: "DELETE",
  });


export const updateAccount = (id: string, data: Partial<CreateAccountDTO>) =>
  apiFetch<Account>(`${BASE_PATH}/${id}`, {
    method: "PATCH",
    body: data,
  });