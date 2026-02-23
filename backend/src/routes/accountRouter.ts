import { Context, Hono } from "hono";
import { createAccount, deleteAccount, getAccountById, getAllAccountsByUser, updateAccount } from "../controllers/accountController";
import { zValidator } from "@hono/zod-validator";
import { accountSchema, updateAccountSchema } from "../schemas/account.schema";
import { uuid, ZodError } from "zod";
import { zodErrorResponse } from "../helpers/zodErrorResponse";
import { AppEnv } from "../types";
import { uuidParamSchema } from "../schemas/uuid.schema";




export const accountRouter = new Hono<AppEnv>();

accountRouter.get("/",
    async (c: Context) => {
        const user = c.get('user')
        return await getAllAccountsByUser(c, user.sub)
    }
)

accountRouter.post("/",
    zValidator("json", accountSchema, (result, c) => {
        if (!result.success && result.error instanceof ZodError) throw result.error
    }),
    async (c) => {
        const user = c.get("user")
        const account = c.req.valid("json")

        return await createAccount(c, user.sub, account)
    }
)

accountRouter.get('/:id',
    zValidator('param', uuidParamSchema, (result, c) => {
        if (!result.success && result.error instanceof ZodError) return zodErrorResponse(result.error, c)
    }),
    async (c) => {
        const userId = c.get("user").sub
        const accountId = c.req.valid("param").id

        return await getAccountById(c, userId, accountId)
    }
)

accountRouter.patch("/:id",
    zValidator("json", updateAccountSchema, (result, c) => {
        if (!result.success && result.error instanceof ZodError) return zodErrorResponse(result.error, c)
    }),
    zValidator("param", uuidParamSchema, (result, c) => {
        if (!result.success && result.error instanceof ZodError) return zodErrorResponse(result.error, c)
    }),
    async (c) => {

        const userId = c.get("user").sub
        const accountId = c.req.valid("param").id
        const account = c.req.valid("json")

        return await updateAccount(c, userId, accountId, account)
    }
)

accountRouter.delete("/:id",
    zValidator("param", uuidParamSchema, (result, c) => {
        if (!result.success && result.error instanceof ZodError) return zodErrorResponse(result.error, c)
    }),
    async (c) => {
        const accountId = c.req.valid("param").id
        const userId = c.get("user").sub
        return await deleteAccount(c, userId, accountId)
    }
)