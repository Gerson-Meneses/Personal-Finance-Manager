import { apiFetch } from "../../shared/api";
import type { Data } from "../../shared/dataApiInterface";
import type { Account, CreateAccountDTO } from "./types";

export const getAccounts = (): Promise<Data<Account>> =>
  apiFetch<Data<Account>>("/accounts");

export const createAccount = async (data: CreateAccountDTO): Promise<Account>  =>
  await apiFetch<Account>("/accounts", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const getAccountById = async (id: string): Promise<Account> =>{
  return await apiFetch<Account>(`/accounts/${id}`);
}
export const deleteAccount = async (id: string): Promise<void> => {
  await apiFetch<void>(`/accounts/${id}`, {
    method: "DELETE",
  })
}

export const updateAccount = async (id: string, data: Partial<CreateAccountDTO>): Promise<Account> => {
  return await apiFetch<Account>(`/accounts/${id}`, {
    method: "PATCH",  
    body: JSON.stringify(data),
  })
}