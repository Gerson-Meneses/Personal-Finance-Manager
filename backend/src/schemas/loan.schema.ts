import { z } from "zod"
import { TypeLoan } from "../utils/Enums"

export const loanSchema = z.object({
    type: z.enum(TypeLoan),
    lender: z.string().min(3),
    principalAmount: z.number().positive().transform(n => n * 100),
    startDate: z.string().refine((date) => !isNaN(Date.parse(date)), { message: "Invalid date format" }), 
    accountId: z.uuid(),
    tea: z.number().positive().max(100).optional(),
    disbursementAmount: z.number().positive().optional(),
    extraCost: z.number().positive().transform(n => n * 100).optional(),
    termInMonths: z.number().positive().optional(),
    installmentAmount: z.number().positive().optional(),
})

export type LoanSchema = z.infer<typeof loanSchema>