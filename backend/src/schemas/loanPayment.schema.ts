import { z } from "zod"
import { ExtraPaymentStrategy } from "../utils/Enums"
import { amountSchema } from "./base.schema"

export const loanPaymentSchema = z.object({
    amount: amountSchema(),
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