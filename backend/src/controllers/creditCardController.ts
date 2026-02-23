import { Context } from 'hono'
import { TransactionService } from '../services/transactionService'


const transactionService = new TransactionService()

export const makePayment = async (c: Context, userId: string, creditCardId: string, paymentData: any) => {
    const payment = await transactionService.makePayment(userId, creditCardId, paymentData)
    return c.json({ message: "Pago realizado con éxito", payment, status: 201 })
}