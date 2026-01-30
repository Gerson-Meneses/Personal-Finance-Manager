import { Context, Hono } from "hono";
import { AppEnv } from "../types";
import { authMiddleware } from "../middlewares/authMiddleware";
import { zValidator } from "@hono/zod-validator";
import {categorySchema} from "../schemas/category.schema"
import { ZodError } from "zod";
import { zodErrorResponse } from "../helpers/zodErrorResponse";
import { createCategory, getAllCategoriesByUser } from "../controllers/categoryController";

export const categoryRouter = new Hono<AppEnv>();

categoryRouter.get("/",
    authMiddleware,
    async (c: Context) => {
        const user = c.get('user')
        return await getAllCategoriesByUser(c, user.sub)
    }
)

categoryRouter.post("/",
    authMiddleware,
    zValidator("json", categorySchema, (result, c) => {
        if (!result.success && result.error instanceof ZodError) return zodErrorResponse(result.error, c)
    }),
    async (c) => {
        const user = c.get("user")
        console.log("User",user)
        console.log(user.sub)
        const account = c.req.valid("json")

        return await createCategory(c, user.sub, account)
    }
)
