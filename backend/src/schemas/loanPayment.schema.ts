import { z } from "zod"
import { ExtraPaymentStrategy } from "../utils/Enums"

export const loanPaymentSchema = z.object({
    amount: z.number().positive().transform(n => n * 100),
    date: z.string().refine((date) => !isNaN(Date.parse(date)), { message: "Invalid date format" }),
    accountId: z.uuid(),
    strategy: z.enum(ExtraPaymentStrategy).optional()
})

export type LoanPaymentSchema = z.infer<typeof loanPaymentSchema>