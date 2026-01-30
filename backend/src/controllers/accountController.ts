import { Context } from "hono";
import { AccountService } from "../services/accountService";
import { UserSchema } from "../schemas/user.schema";
import { User } from "../entities/User.entity";
import { AccountSchema } from "../schemas/account.schema";

const accountService = new AccountService();

export const getAllAccountsByUser = async (c: Context, user: string) => {
    const accounts = await accountService.getAllAccountsByUser(user);
    return c.json({ message: 'Accounts get succesfull', accounts })
}

export const createAccount = async (c: Context, userId: string, account: AccountSchema) => {
    console.log(userId);
    const newAccount = await accountService.createAccount(userId, account)
    return c.json({ message: "Account created succesfull", account })
}