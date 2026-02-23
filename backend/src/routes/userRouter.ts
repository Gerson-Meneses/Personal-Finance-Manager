import { Hono } from "hono";
import { AppEnv } from "../types";
import { authMiddleware } from "../middlewares/authMiddleware";
import { deleteUser, getAll, getInfo } from "../controllers/userController";
import { zValidator } from "@hono/zod-validator";
import { uuidParamSchema } from "../schemas/uuid.schema";
import { zodErrorResponse } from "../helpers/zodErrorResponse";
import { ZodError } from "zod";

export const userRouter = new Hono<AppEnv>()

userRouter.get(
    async (c) => {
        return await getAll(c)
    }
)

userRouter.get('/me',
    authMiddleware,
    async (c) => {
        const user = c.get("user");
        return await getInfo(c, user.sub)
    })

userRouter.delete('/:id',
    zValidator("param", uuidParamSchema, (result, c) => {
        if (!result.success && result.error instanceof ZodError) return zodErrorResponse(result.error, c)
    }),
    async (c) => {
        const userId = c.req.valid("param").id
        return await deleteUser(c, userId)
    })