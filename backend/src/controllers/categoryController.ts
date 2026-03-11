import { Context } from "hono";
import { CategoryService } from "../services/categoryService";
import { CategorySchema, UpdateCategorySchema } from "../schemas/category.schema";
import { UuidSchema } from "../schemas/uuid.schema";
import { PaginationQuerySchema } from "../schemas/queryPagination.schema";
import { ApiPaginated } from "../typesResponseHttp/apiResponses";
import { Category } from "../entities/Category.entity";
import { paginated } from "../helpers/responses";

const categoryService = new CategoryService();

export const getAllCategoriesByUser = async (c: Context, user: UuidSchema, filters: PaginationQuerySchema) => {
    const result = await categoryService.getCategoriesByUser(user, filters);
    return c.json<ApiPaginated<Category>>(paginated(result.items, result.total, result.page, result.limit), 200)
}

export const getCategoryById = async (c: Context, userId: UuidSchema, categoryId: UuidSchema) => {
    const category = await categoryService.getCategoryById(categoryId, userId)
    return c.json({ message: "Category found succesfull", category, structuredClone: true })
}

export const createCategory = async (c: Context, userId: UuidSchema, account: CategorySchema) => {
    const newAccount = await categoryService.createCategory(account, userId)
    return c.json(newAccount, 201)
}

export const updateCategory = async (c: Context, userId: UuidSchema, categoryId: UuidSchema, categoryUpdate: UpdateCategorySchema) => {
    const updatedCategory = await categoryService.updateCategory(userId, categoryId, categoryUpdate)
    return c.json({ message: "Category updated succesfull", category: updatedCategory })
}

export const deleteCategory = async (c: Context, userId: UuidSchema, categoryId: UuidSchema) => {
    const deletedCategory = await categoryService.deleteCategory(userId, categoryId)
    return c.json(204)
}