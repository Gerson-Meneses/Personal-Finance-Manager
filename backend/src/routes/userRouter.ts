import { Hono } from "hono";
import { AppEnv } from "../types";
import { authMiddleware, adminMiddleware } from "../middlewares/authMiddleware";
import { deleteOwnAccount, deleteUser, generateDeleteCode, getAll, getInfo } from "../controllers/userController";
import { zValidator } from "@hono/zod-validator";
import { uuidParamSchema } from "../schemas/uuid.schema";
import { deleteAccountSchema } from "../schemas/deleteAccount.schema";
import { zodErrorResponse } from "../helpers/zodErrorResponse";
import { getClientIP } from "../utils/getIpClient";
import { ZodError } from "zod";

export const userRouter = new Hono<AppEnv>()

userRouter.get(
    authMiddleware,
    adminMiddleware,
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

userRouter.post('/delete/code',
    authMiddleware,
    async (c) => {
        const { sub } = c.get("user")
        const ip = getClientIP(c)
        return await generateDeleteCode(c, sub, ip)
    })

userRouter.delete('/me',
    authMiddleware,
    zValidator("json", deleteAccountSchema, (result, c) => {
        if (!result.success && result.error instanceof ZodError) return zodErrorResponse(result.error, c)
    }),
    async (c) => {
        const { sub } = c.get("user")
        const data = c.req.valid("json")
        const ip = getClientIP(c)
        return await deleteOwnAccount(c, sub, data, ip)
    })

userRouter.delete('/:id',
    authMiddleware,
    adminMiddleware,
    zValidator("param", uuidParamSchema, (result, c) => {
        if (!result.success && result.error instanceof ZodError) return zodErrorResponse(result.error, c)
    }),
    async (c) => {
        const userId = c.req.valid("param").id
        return await deleteUser(c, userId)
    })
