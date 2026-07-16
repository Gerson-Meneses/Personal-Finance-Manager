import { z } from 'zod';
import { amountSchema } from './base.schema';

export const paymentCreditCardSchema = z.object({
    amount: amountSchema("Amount"),
    date: z.string({ message: "Date es requerido" }).refine((date) => !isNaN(Date.parse(date)), { message: "Formato de fecha inválido" }),
    time: z.string({ message: "Time es deber ser un string válido" }).optional(),
    accountId: z.uuid({ message: "Account ID es requerido" }),
    description: z
        .string({ message: "Description debe ser una cadena de texto." })
        .optional(),
})

export type PaymentCreditCardSchema = z.infer<typeof paymentCreditCardSchema>;