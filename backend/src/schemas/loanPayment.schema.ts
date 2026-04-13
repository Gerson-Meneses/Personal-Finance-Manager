import { z } from "zod"
import { ExtraPaymentStrategy } from "../utils/Enums"

export const loanPaymentSchema = z.object({
    amount: z.number({ message: "Amount es requerido" }).positive({ message: "Amount debe ser un número positivo" }).transform(n => n * 100),
    date: z
        .string({ message: "Date es requerido" })
        .refine((date) => !isNaN(Date.parse(date)), { message: "Invalid date format" }),

    time: z
        .string({ message: "Time debe tener un formato válido(HH:mm)" })
        .optional(),
        
    description: z
        .string({ message: "Description debe ser una cadena de texto." })
        .optional(),

    accountId: z.uuid({ message: "Account ID debe ser un UUID válido" }),
    strategy: z.enum(ExtraPaymentStrategy, { message: "Strategy debe ser 'REDUCE_INSTALLMENT' o 'REDUCE_TERM' " }).optional()
})

export type LoanPaymentSchema = z.infer<typeof loanPaymentSchema>