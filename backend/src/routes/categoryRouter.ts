import { Context, Hono } from "hono";
import { AppEnv } from "../types";
import { zValidator } from "@hono/zod-validator";
import { categorySchema, UpdateCategorySchema, updateCategorySchema } from "../schemas/category.schema"
import { ZodError } from "zod";
import { zodErrorResponse } from "../helpers/zodErrorResponse";
import { createCategory, deleteCategory, getAllCategoriesByUser, getCategoryById, updateCategory } from "../controllers/categoryController";
import { uuidParamSchema, UuidSchema } from "../schemas/uuid.schema";

export const categoryRouter = new Hono<AppEnv>();


categoryRouter.get("/",
    async (c: Context) => {
        const user = c.get('user')
        return await getAllCategoriesByUser(c, user.sub)
    }
)

categoryRouter.get("/:id",
    zValidator('param', uuidParamSchema, (result, c) => {
        if (!result.success && result.error instanceof ZodError) return zodErrorResponse(result.error, c)
    }),
    async (c) => {
        const userId: UuidSchema = c.get("user").sub
        const categoryId: UuidSchema = c.req.valid("param").id
        return await getCategoryById(c, userId, categoryId)
    }
)

categoryRouter.post("/",
    zValidator("json", categorySchema, (result, c) => {
        if (!result.success && result.error instanceof ZodError) return zodErrorResponse(result.error, c)
    }),
    async (c) => {
        const user = c.get("user")
        const account = c.req.valid("json")

        return await createCategory(c, user.sub, account)
    }
)

categoryRouter.patch('/:id',
    zValidator("json", updateCategorySchema, (result, c) => {
        if (!result.success && result.error instanceof ZodError) return zodErrorResponse(result.error, c)
    }),
    zValidator('param', uuidParamSchema, (result, c) => {
        if (!result.success && result.error instanceof ZodError) return zodErrorResponse(result.error, c)
    }),
    async (c) => {
        const userId: UuidSchema = c.get("user").sub
        const categoryId: UuidSchema = c.req.valid("param").id
        const categoryUpdate: UpdateCategorySchema = c.req.valid("json")
        return await updateCategory(c, userId, categoryId, categoryUpdate)
    }
)

categoryRouter.delete('/:id',
    zValidator('param', uuidParamSchema, (result, c) => {
        if (!result.success && result.error instanceof ZodError) return zodErrorResponse(result.error, c)
    }),
    async (c) => {
        const userId: UuidSchema = c.get("user").sub
        const categoryId: UuidSchema = c.req.valid("param").id
        return await deleteCategory(c, userId, categoryId)
    }
)