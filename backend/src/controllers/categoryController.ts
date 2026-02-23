import { Context } from "hono";
import { CategoryService } from "../services/categoryService";
import { CategorySchema, UpdateCategorySchema } from "../schemas/category.schema";
import { UuidSchema } from "../schemas/uuid.schema";

const categoryService = new CategoryService();

export const getAllCategoriesByUser = async (c: Context, user: string) => {
    const categories = await categoryService.getCategoriesByUser(user);
    return c.json({ message: 'Categories get succesfull', categories })
}

export const getCategoryById = async (c: Context, userId: UuidSchema, categoryId: UuidSchema) => {
    const category = await categoryService.getCategoryById(categoryId, userId)
    return c.json({ message: "Category found succesfull", category, structuredClone: true })
}

export const createCategory = async (c: Context, userId: UuidSchema, account: CategorySchema) => {
    const newAccount = await categoryService.createCategory(account, userId)
    return c.json({ message: "Category created succesfull", account, status:201 })
}

export const updateCategory = async (c: Context, userId: UuidSchema, categoryId: UuidSchema, categoryUpdate: UpdateCategorySchema) => {
    const updatedCategory = await categoryService.updateCategory(userId, categoryId, categoryUpdate)
    return c.json({ message: "Category updated succesfull", category: updatedCategory })
}

export const deleteCategory = async (c: Context, userId: UuidSchema, categoryId: UuidSchema) => {
    const deletedCategory = await categoryService.deleteCategory(userId, categoryId)
    return c.json({ message: "Category deleted succesfull", category: deletedCategory })
}