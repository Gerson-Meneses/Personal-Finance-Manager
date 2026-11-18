import { Context, Hono } from 'hono'
import { z } from 'zod'
import { authMiddleware } from '../middlewares/authMiddleware'
import { AppEnv } from '../types'
import {
    cancelInstallmentPlan,
    confirmAllPending,
    confirmPending,
    createCharge,
    createInstallmentPlan,
    deleteCharge,
    deleteDocument,
    downloadDocument,
    getSummary,
    listDocuments,
    makePayment,
    previewInstallmentPlan,
    updateCharge,
    uploadDocument,
} from '../controllers/creditCardController'
import { zValidator } from '@hono/zod-validator'
import { ZodError } from 'zod'
import { zodErrorResponse } from '../helpers/zodErrorResponse'
import { paymentCreditCardSchema } from '../schemas/paymentCreditCard.schema'
import { uuidParamSchema } from '../schemas/uuid.schema'
import {
    confirmPendingSchema,
    createChargeSchema,
    createInstallmentPlanSchema,
    updateChargeSchema,
} from '../schemas/creditCard.schema'

const cardParamSchema = z.object({ id: z.uuid() })
const pendingParamSchema = z.object({ id: z.uuid(), transactionId: z.uuid() })
const chargeParamSchema = z.object({ id: z.uuid(), chargeId: z.uuid() })
const planParamSchema = z.object({ id: z.uuid(), planId: z.uuid() })
const documentParamSchema = z.object({ id: z.uuid(), documentId: z.uuid() })

const validateParam = <T extends z.ZodTypeAny>(schema: T) =>
    zValidator('param', schema, (result, c) => {
        if (!result.success && result.error instanceof ZodError) {
            return zodErrorResponse(result.error, c)
        }
    })

const validateJson = <T extends z.ZodTypeAny>(schema: T) =>
    zValidator('json', schema, (result, c) => {
        if (!result.success && result.error instanceof ZodError) {
            return zodErrorResponse(result.error, c)
        }
    })

export const creditCardRouter = new Hono<AppEnv>()

creditCardRouter.get(
    '/:id/summary',
    authMiddleware,
    validateParam(cardParamSchema),
    async (c) => {
        const { id } = c.req.valid('param')
        return await getSummary(c, c.get('user').sub, id)
    }
)

creditCardRouter.post(
    '/:id/pending/confirm-all',
    authMiddleware,
    validateParam(cardParamSchema),
    async (c) => {
        const { id } = c.req.valid('param')
        return await confirmAllPending(c, c.get('user').sub, id)
    }
)

creditCardRouter.post(
    '/:id/pending/:transactionId/confirm',
    authMiddleware,
    validateParam(pendingParamSchema),
    validateJson(confirmPendingSchema),
    async (c) => {
        const { id, transactionId } = c.req.valid('param')
        const payload = c.req.valid('json')
        return await confirmPending(c, c.get('user').sub, id, transactionId, payload)
    }
)

creditCardRouter.post(
    '/:id/installment-plans/preview',
    authMiddleware,
    validateParam(cardParamSchema),
    validateJson(createInstallmentPlanSchema),
    async (c) => {
        const { id } = c.req.valid('param')
        return await previewInstallmentPlan(c, c.get('user').sub, id, c.req.valid('json'))
    }
)

creditCardRouter.post(
    '/:id/installment-plans',
    authMiddleware,
    validateParam(cardParamSchema),
    validateJson(createInstallmentPlanSchema),
    async (c) => {
        const { id } = c.req.valid('param')
        return await createInstallmentPlan(c, c.get('user').sub, id, c.req.valid('json'))
    }
)

creditCardRouter.delete(
    '/:id/installment-plans/:planId',
    authMiddleware,
    validateParam(planParamSchema),
    async (c) => {
        const { id, planId } = c.req.valid('param')
        return await cancelInstallmentPlan(c, c.get('user').sub, id, planId)
    }
)

creditCardRouter.post(
    '/:id/charges',
    authMiddleware,
    validateParam(cardParamSchema),
    validateJson(createChargeSchema),
    async (c) => {
        const { id } = c.req.valid('param')
        return await createCharge(c, c.get('user').sub, id, c.req.valid('json'))
    }
)

creditCardRouter.patch(
    '/:id/charges/:chargeId',
    authMiddleware,
    validateParam(chargeParamSchema),
    validateJson(updateChargeSchema),
    async (c) => {
        const { id, chargeId } = c.req.valid('param')
        return await updateCharge(c, c.get('user').sub, id, chargeId, c.req.valid('json'))
    }
)

creditCardRouter.delete(
    '/:id/charges/:chargeId',
    authMiddleware,
    validateParam(chargeParamSchema),
    async (c) => {
        const { id, chargeId } = c.req.valid('param')
        return await deleteCharge(c, c.get('user').sub, id, chargeId)
    }
)

creditCardRouter.get(
    '/:id/documents',
    authMiddleware,
    validateParam(cardParamSchema),
    async (c) => {
        const { id } = c.req.valid('param')
        return await listDocuments(c, c.get('user').sub, id)
    }
)

creditCardRouter.post(
    '/:id/documents',
    authMiddleware,
    validateParam(cardParamSchema),
    async (c) => {
        const { id } = c.req.valid('param')
        return await uploadDocument(c, c.get('user').sub, id)
    }
)

creditCardRouter.get(
    '/:id/documents/:documentId/download',
    authMiddleware,
    validateParam(documentParamSchema),
    async (c) => {
        const { id, documentId } = c.req.valid('param')
        return await downloadDocument(c, c.get('user').sub, id, documentId)
    }
)

creditCardRouter.delete(
    '/:id/documents/:documentId',
    authMiddleware,
    validateParam(documentParamSchema),
    async (c) => {
        const { id, documentId } = c.req.valid('param')
        return await deleteDocument(c, c.get('user').sub, id, documentId)
    }
)

creditCardRouter.post(
    '/:id/pay',
    authMiddleware,
    zValidator('param', uuidParamSchema, (result, c) => {
        if (!result.success && result.error instanceof ZodError) return zodErrorResponse(result.error, c)
    }),
    zValidator('json', paymentCreditCardSchema, (result, c) => {
        if (!result.success && result.error instanceof ZodError) return zodErrorResponse(result.error, c)
    }),
    async (c) => {
        const { id } = c.req.valid('param')
        const user = c.get('user')
        const paymentCreditCard = c.req.valid('json')
        return await makePayment(c, user.sub, id, paymentCreditCard)
    }
)
