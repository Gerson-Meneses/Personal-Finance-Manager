import { Context, Hono } from "hono";
import { AppEnv, TransactionFilters } from "../types";
import { authMiddleware } from "../middlewares/authMiddleware";
import { zValidator } from "@hono/zod-validator";
import { ZodError } from "zod";
import { zodErrorResponse } from "../helpers/zodErrorResponse";
import { createTransaction, deleteTransaction, getAllTransactionsByUser, getTransactionById, transferTransaction } from "../controllers/transactionController";
import { transactionSchema } from "../schemas/transaction.schema";
import { transferSchema } from "../schemas/transfers.schema";
import { transactionQuerySchema } from "../schemas/querysTransaction.schems";
import { uuidParamSchema } from "../schemas/uuid.schema";

export const transactionRouter = new Hono<AppEnv>();

transactionRouter.get("/",
    async (c) => {
        const userId = c.get('user').sub;
        const parsed = transactionQuerySchema.safeParse(c.req.query());

        if (!parsed.success) {
            return c.json(
                {
                    message: 'Invalid query params',
                    errors: parsed.error.flatten().fieldErrors,
                },
                400
            );
        }

        const filters: TransactionFilters = {
            userId,
            ...parsed.data,
        };
        return await getAllTransactionsByUser(c, filters)
    }
)

transactionRouter.get("/:id",
    zValidator("param", uuidParamSchema, (result, c) => {
        if (!result.success && result.error instanceof ZodError) return zodErrorResponse(result.error, c)
    }),
    async (c) => {
        const userId = c.get('user').sub;
        const transactionId = c.req.valid("param").id
        return await getTransactionById(c, userId, transactionId)
    }
)

transactionRouter.post("/",
    zValidator("json", transactionSchema, (result, c) => {
        if (!result.success && result.error instanceof ZodError) return zodErrorResponse(result.error, c)
    }),
    async (c) => {
        const user = c.get("user")
        const transaction = c.req.valid("json")

        return await createTransaction(c, user.sub, transaction)
    }
)


transactionRouter.post("/transfer",
    authMiddleware,
    zValidator("json", transferSchema, (result, c) => {
        if (!result.success && result.error instanceof ZodError) return zodErrorResponse(result.error, c)
    }),
    async (c) => {
        const user = c.get("user")
        const account = c.req.valid("json")

        return await transferTransaction(c, user.sub, account)
    }
)


transactionRouter.delete("/:id",
    zValidator("param", uuidParamSchema, (result, c) => {
        if (!result.success && result.error instanceof ZodError) return zodErrorResponse(result.error, c)
    }),
    async (c) => {
        const userId = c.get('user').sub;
        const transactionId = c.req.valid("param").id
        return await deleteTransaction(c, userId, transactionId)
    }
)