import { Hono } from "hono";
import { AppEnv } from "../types";
import { zValidator } from "@hono/zod-validator";
import { uuidParamSchema } from "../schemas/uuid.schema";
import { z, ZodError } from "zod";
import { zodErrorResponse } from "../helpers/zodErrorResponse";
import { loanSchema, updateLoanSchema, cancelLoanSchema, forgiveLoanSchema, updateLoanMovementSchema, reverseLoanMovementSchema, type UpdateLoanOutput, type CancelLoanOutput, type ForgiveLoanOutput, type UpdateLoanMovementOutput, type ReverseLoanMovementOutput } from "../schemas/loan.schema";
import {
    createLoan,
    getAllLoans,
    payLoan,
    getAllLoanSummary,
    getLoanById,
    quickPayLender,
    updateLoan,
    cancelLoan,
    getLoanAudit,
    forgiveLoan,
    updateLoanMovement,
    reverseLoanMovement,
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
loanRouter.patch(
    '/:id',
    zValidator('param', uuidParamSchema, (result, c) => {
        if (!result.success && result.error instanceof ZodError) return zodErrorResponse(result.error, c)
    }),
    zValidator('json', updateLoanSchema, (result, c) => {
        if (!result.success && result.error instanceof ZodError) return zodErrorResponse(result.error, c)
    }),
    async (c) => {
        const user = c.get('user');
        return await updateLoan(c, user.sub, c.req.valid('param').id, c.req.valid('json') as UpdateLoanOutput);
    }
)

loanRouter.post(
    '/:id/cancel',
    zValidator('param', uuidParamSchema, (result, c) => {
        if (!result.success && result.error instanceof ZodError) return zodErrorResponse(result.error, c)
    }),
    zValidator('json', cancelLoanSchema, (result, c) => {
        if (!result.success && result.error instanceof ZodError) return zodErrorResponse(result.error, c)
    }),
    async (c) => {
        const user = c.get('user');
        return await cancelLoan(c, user.sub, c.req.valid('param').id, c.req.valid('json') as CancelLoanOutput);
    }
)

loanRouter.get(
    '/:id/audit',
    zValidator('param', uuidParamSchema, (result, c) => {
        if (!result.success && result.error instanceof ZodError) return zodErrorResponse(result.error, c)
    }),
    async (c) => {
        const user = c.get('user');
        return await getLoanAudit(c, user.sub, c.req.valid('param').id);
    }
)

loanRouter.post(
    '/:id/forgiveness',
    zValidator('param', uuidParamSchema, (result, c) => {
        if (!result.success && result.error instanceof ZodError) return zodErrorResponse(result.error, c)
    }),
    zValidator('json', forgiveLoanSchema, (result, c) => {
        if (!result.success && result.error instanceof ZodError) return zodErrorResponse(result.error, c)
    }),
    async (c) => {
        const user = c.get('user');
        return await forgiveLoan(c, user.sub, c.req.valid('param').id, c.req.valid('json') as ForgiveLoanOutput);
    }
)

const movementParamsSchema = z.object({
    id: z.uuid({ message: "Loan ID inválido" }),
    movementId: z.uuid({ message: "Movement ID inválido" }),
});

loanRouter.patch(
    '/:id/movements/:movementId',
    zValidator('param', movementParamsSchema, (result, c) => {
        if (!result.success && result.error instanceof ZodError) return zodErrorResponse(result.error, c)
    }),
    zValidator('json', updateLoanMovementSchema, (result, c) => {
        if (!result.success && result.error instanceof ZodError) return zodErrorResponse(result.error, c)
    }),
    async (c) => {
        const user = c.get('user');
        const params = c.req.valid('param');
        return await updateLoanMovement(
            c,
            user.sub,
            params.id,
            params.movementId,
            c.req.valid('json') as UpdateLoanMovementOutput
        );
    }
)

loanRouter.post(
    '/:id/movements/:movementId/reverse',
    zValidator('param', movementParamsSchema, (result, c) => {
        if (!result.success && result.error instanceof ZodError) return zodErrorResponse(result.error, c)
    }),
    zValidator('json', reverseLoanMovementSchema, (result, c) => {
        if (!result.success && result.error instanceof ZodError) return zodErrorResponse(result.error, c)
    }),
    async (c) => {
        const user = c.get('user');
        const params = c.req.valid('param');
        return await reverseLoanMovement(
            c,
            user.sub,
            params.id,
            params.movementId,
            c.req.valid('json') as ReverseLoanMovementOutput
        );
    }
)
