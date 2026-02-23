import { Context, Hono } from 'hono'
import { authMiddleware } from '../middlewares/authMiddleware'
import { AppEnv } from '../types'
import { makePayment } from '../controllers/creditCardController'
import { zValidator } from '@hono/zod-validator'
import { ZodError } from 'zod'
import { zodErrorResponse } from '../helpers/zodErrorResponse'
import { paymentCreditCardSchema } from '../schemas/paymentCreditCard.schema'
import { uuidParamSchema } from '../schemas/uuid.schema'


export const creditCardRouter = new Hono<AppEnv>()

creditCardRouter.post('/:id/pay',
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
