import { Context } from "hono";
import { AccountService } from "../services/accountService";
import { AccountSchema, UpdateAccountSchema } from "../schemas/account.schema";
import { UuidSchema } from "../schemas/uuid.schema";
import { PaginationQuerySchema } from "../schemas/queryPagination.schema";
import { ApiPaginated } from "../typesResponseHttp/apiResponses";
import { Account } from "../entities/Account.entity";
import { paginated } from "../helpers/responses";

const accountService = new AccountService();

export const getAllAccountsByUser = async (c: Context, user: UuidSchema, filters: PaginationQuerySchema) => {
    const result = await accountService.getAllAccountsByUser(user, filters);
    return c.json<ApiPaginated<Account>>(paginated(result.items, result.total, result.page, result.limit), 200)
}

export const createAccount = async (c: Context, userId: UuidSchema, account: AccountSchema) => {
    const newAccount = await accountService.createAccount(userId, account)
    return c.json(newAccount, 201)
}

export const getAccountById = async (c: Context, userId: string, accountId: UuidSchema) => {
    const account = await accountService.getAccountById(accountId, userId)
    return c.json(account)
}
export const updateAccount = async (c: Context, userId: string, accountId: UuidSchema, updateData: UpdateAccountSchema) => {
    const updatedAccount = await accountService.updateAccount(accountId, userId, updateData)
    return c.json(updatedAccount, 200)
}

export const deleteAccount = async (c: Context, userId: UuidSchema, accountId: UuidSchema) => {
    const account = await accountService.deleteAccount(accountId, userId)
    return c.json(204)
}

