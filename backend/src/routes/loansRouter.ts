import { Hono } from "hono";
import { AppEnv } from "../types";
import { zValidator } from "@hono/zod-validator";
import { uuidParamSchema } from "../schemas/uuid.schema";
import { ZodError } from "zod";
import { zodErrorResponse } from "../helpers/zodErrorResponse";
import { loanSchema } from "../schemas/loan.schema";
import {
    createLoan,
    getAllLoans,
    payLoan,
    getAllLoanSummary,
    getLoanById,
    quickPayLender
} from "../controllers/loansController";
import { quickPaymentSchema } from "../schemas/quickPayment.schema";
import { loanPaymentSchema } from "../schemas/loanPayment.schema";
import { loanQuerySchema } from "../schemas/Loanquery,schema";
import { loanSummaryQuerySchema } from "../schemas/LoanSummaryQuery.schema";

export const loanRouter = new Hono<AppEnv>

// 1. Listado global paginado
loanRouter.get('/',
    zValidator('query', loanQuerySchema, (result, c) => {
        if (!result.success && result.error instanceof ZodError) return zodErrorResponse(result.error, c)
    }),
    async (c) => {
        const filters = c.req.valid('query');
        const user = c.get('user');
        return await getAllLoans(c, user.sub, filters);
    }
)

// 2. Resumen agrupado por acreedor/deudor
loanRouter.get('/summary',
    zValidator('query', loanSummaryQuerySchema, (result, c) => {
        if (!result.success && result.error instanceof ZodError) return zodErrorResponse(result.error, c)
    }),
    async (c) => {
        const filters = c.req.valid('query');
        const user = c.get('user');
        return await getAllLoanSummary(c, user.sub, filters);
    })

// 4. Obtener un préstamo específico por ID
loanRouter.get('/:id',
    zValidator('param', uuidParamSchema, (result, c) => {
        if (!result.success && result.error instanceof ZodError) return zodErrorResponse(result.error, c)
    }),
    async (c) => {
        const user = c.get('user');
        return await getLoanById(c, user.sub);
    }
)

// 5. Crear un nuevo préstamo
loanRouter.post('/',
    zValidator('json', loanSchema, (result, c) => {
        if (!result.success && result.error instanceof ZodError) return zodErrorResponse(result.error, c)
    }),
    async (c) => {
        const user = c.get('user');
        const loanData = c.req.valid('json');
        return await createLoan(c, user.sub, loanData);
    }
)

// 6. Pago rápido (múltiples préstamos de una persona)
loanRouter.post('/quick-pay',
    zValidator('json', quickPaymentSchema, (result, c) => {
        if (!result.success && result.error instanceof ZodError) return zodErrorResponse(result.error, c)
    }),
    async (c) => {
        const user = c.get('user');
        const data = c.req.valid('json');
        return await quickPayLender(c, user.sub, data);
    }
)

// 7. Pago a un préstamo específico
loanRouter.post('/:id/pay',
    zValidator('json', loanPaymentSchema, (result, c) => {
        if (!result.success && result.error instanceof ZodError) return zodErrorResponse(result.error, c)
    }),
    zValidator('param', uuidParamSchema, (result, c) => {
        if (!result.success && result.error instanceof ZodError) return zodErrorResponse(result.error, c)
    }),
    async (c) => {
        const { id } = c.req.valid('param');
        const user = c.get('user');
        const paymentData = c.req.valid('json');
        return await payLoan(c, user.sub, id, paymentData);
    }
)