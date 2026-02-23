import { z } from 'zod';


export const paymentCreditCardSchema = z.object({
    amount: z.number().positive().min(10, { message: "La cantidad minima son 10 centavos." }),
    date: z.string().refine((date) => !isNaN(Date.parse(date)), { message: "Invalid date format" }),
    time: z.string().optional(),
    account: z.string().uppercase(),
})

export type PaymentCreditCardSchema = z.infer<typeof paymentCreditCardSchema>;