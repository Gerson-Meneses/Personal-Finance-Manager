import { z } from "zod"
import { TypeLoan } from "../utils/Enums"

export const loanSchema = z.object({
    type: z
        .enum(TypeLoan, { message: "Type debe ser 'RECEIVED' o 'GIVEN'" }),

    lender: z
        .string({ message: "Lender es requerido" })
        .trim()
        .min(3, { message: "Lender debe tener al menos 3 caracteres" }),

    date: z
        .string({ message: "Date es requerido" })
        .refine((date) => !isNaN(Date.parse(date)), { message: "Invalid date format" }),

    time: z
        .string({ message: "Time debe tener un formato válido(HH:mm)" })
        .optional(),

    description: z
        .string({ message: "Description debe ser una cadena de texto." })
        .optional(),

    principalAmount: z.number({ message: "Principal amount es requerido" }).positive({ message: "Principal amount debe ser un número positivo" }).transform(n => n * 100),

    startDate: z.string({ message: "Start date es requerido" }).refine((date) => !isNaN(Date.parse(date)), { message: "Invalid date format" }),

    accountId: z.uuid({ message: "Account ID debe ser un UUID válido" }),

    tea: z.number({ message: "TEA es requerido" }).positive({ message: "TEA debe ser un número positivo" }).max(100, { message: "TEA debe ser un número menor o igual a 100" }).optional(),

    disbursementAmount: z.number({ message: "Disbursement amount es requerido" }).positive({ message: "Disbursement amount debe ser un número positivo" }).optional(),

    extraCost: z.number({ message: "Extra cost es requerido" }).positive({ message: "Extra cost debe ser un número positivo" }).transform(n => n * 100).optional(),

    termInMonths: z.number({ message: "Term in months es requerido" }).positive({ message: "Term in months debe ser un número positivo" }).optional(),

    installmentAmount: z.number({ message: "Installment amount es requerido" }).positive({ message: "Installment amount debe ser un número positivo" }).optional(),
})

export type LoanSchema = z.infer<typeof loanSchema>