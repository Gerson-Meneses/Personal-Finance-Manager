import { Hono } from "hono";
import { AppEnv } from "../types";
import { authMiddleware } from "../middlewares/authMiddleware";
import { zValidator } from "@hono/zod-validator";
import { uuidParamSchema } from "../schemas/uuid.schema";
import { ZodError } from "zod";
import { zodErrorResponse } from "../helpers/zodErrorResponse";
import { loanSchema } from "../schemas/loan.schema";
import { createLoan, getAllLoans, payLoan } from "../controllers/loansController";
import { PaginationQuerySchema, paginationQuerySchema } from "../schemas/queryPagination.schema";
import { LoanPaymentSchema, loanPaymentSchema } from "../schemas/loanPayment.schema";

export const loanRouter = new Hono<AppEnv>

loanRouter.get('',
    async (c) => {
        const parsed = paginationQuerySchema.safeParse(c.req.query());
        if (!parsed.success) {
            return zodErrorResponse(parsed.error, c)
        }
        const filters: PaginationQuerySchema = {
            ...parsed.data,
        };
        const user = c.get('user')
        return await getAllLoans(c, user.sub, filters)
    }
)

loanRouter.post('/',
    zValidator('json', loanSchema, (result, c) => {
        if (!result.success && result.error instanceof ZodError) return zodErrorResponse(result.error, c)
    }),
    async (c) => {
        const user = c.get('user')
        const paymentCreditCard = c.req.valid('json')
        return await createLoan(c, user.sub, paymentCreditCard)
    }

)

loanRouter.post('/:id/pay',
    zValidator('json', loanPaymentSchema, (result, c) => {
        if (!result.success && result.error instanceof ZodError) return zodErrorResponse(result.error, c)
    }),
    zValidator('param', uuidParamSchema, (result, c) => {
        if (!result.success && result.error instanceof ZodError) return zodErrorResponse(result.error, c)
    }),
    async (c) => {
        const { id } = c.req.valid('param')
        const user = c.get('user')
        const paymentLoan: LoanPaymentSchema = c.req.valid('json')
        return await payLoan(c, user.sub, id, paymentLoan)
    }

)
