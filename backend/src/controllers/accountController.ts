import { Context } from "hono";
import { AccountService } from "../services/accountService";    
import { AccountSchema, UpdateAccountSchema } from "../schemas/account.schema";
import { UuidSchema } from "../schemas/uuid.schema";

const accountService = new AccountService();

export const getAllAccountsByUser = async (c: Context, user: string) => {
    const accounts = await accountService.getAllAccountsByUser(user);
    return c.json({ message: 'Accounts get succesfull', accounts })
}

export const createAccount = async (c: Context, userId: UuidSchema, account: AccountSchema) => {
    const newAccount = await accountService.createAccount(userId, account)
    return c.json({ message: "Account created succesfull", account: newAccount, status: 201 })
}

export const getAccountById = async (c: Context, userId: string, accountId: UuidSchema) => {
    const account = await accountService.getAccountById(accountId, userId)
    return c.json({ message: "Account get succesfull", account })
}
export const updateAccount = async (c: Context, userId: string, accountId: UuidSchema, updateData: UpdateAccountSchema) => {
    const updatedAccount = await accountService.updateAccount(accountId, userId, updateData)
    return c.json({ message: "Account updated succesfull", updatedAccount })
}

export const deleteAccount = async (c: Context, userId: UuidSchema, accountId: UuidSchema) => {
    const account = await accountService.deleteAccount(accountId, userId)
    return c.json({ message: "Account deleted succesfull", account })
}

