import { Context } from "hono";
import { AccountSchema } from "../schemas/account.schema";
import { CategoryService } from "../services/categoryService";
import { CategorySchema } from "../schemas/category.schema";

const categoryService = new CategoryService();

export const getAllCategoriesByUser = async (c: Context, user: string) => {
    const categories = await categoryService.getAccountsByUser(user);
    return c.json({ message: 'Categories get succesfull', categories })
}

export const createCategory = async (c: Context, userId: string, account: CategorySchema) => {
    console.log(userId);
    const newAccount = await categoryService.createAccount(account, userId)
    return c.json({ message: "Category created succesfull", account })
}