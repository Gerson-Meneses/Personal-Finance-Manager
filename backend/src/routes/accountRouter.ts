import { Context, Hono } from "hono";
import { authMiddleware } from "../middlewares/authMiddleware";
import { createAccount, getAllAccountsByUser } from "../controllers/accountController";
import { zValidator } from "@hono/zod-validator";
import { AccountSchema, accountSchema } from "../schemas/account.schema";
import { ZodError } from "zod";
import { zodErrorResponse } from "../helpers/zodErrorResponse";
import { AppEnv } from "../types";




export const accountRouter = new Hono<AppEnv>();

accountRouter.get("/",
    authMiddleware,
    async (c: Context) => {
        const user = c.get('user')
        return await getAllAccountsByUser(c, user.sub)
    }
)

accountRouter.post("/",
    authMiddleware,
    zValidator("json", accountSchema, (result, c) => {
        if (!result.success && result.error instanceof ZodError) return zodErrorResponse(result.error, c)
    }),
    async (c) => {
        const user = c.get("user")
        console.log("User",user)
        console.log(user.sub)
        const account = c.req.valid("json")

        return await createAccount(c, user.sub, account)
    }
)
