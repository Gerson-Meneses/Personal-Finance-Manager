import { z } from 'zod';

export const paymentCreditCardSchema = z.object({
    amount: z.number({ message: "Amount es requerido" }).positive({ message: "Amount debe ser un número positivo" }).min(0.1, { message: "La cantidad minima son 10 centavos." }).transform(n => n * 100),
    date: z.string({ message: "Date es requerido" }).refine((date) => !isNaN(Date.parse(date)), { message: "Formato de fecha inválido" }),
    time: z.string({ message: "Time es deber ser un string válido" }).optional(),
    accountId: z.uuid({ message: "Account ID es requerido" }),
    description: z
        .string({ message: "Description debe ser una cadena de texto." })
        .optional(),
})

export type PaymentCreditCardSchema = z.infer<typeof paymentCreditCardSchema>;