import { z } from "zod"
import { TypeLoan } from "../utils/Enums"
import { amountSchema, dateSchema, descriptionSchema, nameSchema, textSchema, timeSchema } from "./base.schema"

export const loanSchema = z.object({
    type: z
        .enum(TypeLoan, { message: "Type debe ser 'RECEIVED' o 'GIVEN'" }),

    lender: nameSchema("Deudor/Acreedor"),

    contactId: z.uuid({ message: "Contact ID debe ser un UUID válido" }).optional(),

    notes: z.string().trim().max(150, { message: "Las notas no pueden exceder 150 caracteres" }).optional(),

    date: dateSchema(),

    time: timeSchema().optional(),

    description: descriptionSchema(),

    amount: amountSchema(),

    startDate: z.string({ message: "Start date es requerido" }).refine((date) => !isNaN(Date.parse(date)), { message: "Invalid date format" }),

    accountId: z.uuid({ message: "Account ID debe ser un UUID válido" }),

    tea: z.number({ message: "TEA es requerido" }).positive({ message: "TEA debe ser un número positivo" }).max(100, { message: "TEA debe ser un número menor o igual a 100" }).optional(),

    disbursementAmount: z.number({ message: "Disbursement amount es requerido" }).positive({ message: "Disbursement amount debe ser un número positivo" }).optional(),

    extraCost: z.number({ message: "Extra cost es requerido" }).positive({ message: "Extra cost debe ser un número positivo" }).transform(n => n * 100).optional(),

    termInMonths: z.number({ message: "Term in months es requerido" }).positive({ message: "Term in months debe ser un número positivo" }).optional(),

    installmentAmount: z.number({ message: "Installment amount es requerido" }).positive({ message: "Installment amount debe ser un número positivo" }).optional(),
})

export type LoanSchema = z.infer<typeof loanSchema>

export const updateLoanSchema = z
    .object({
        contactId: z.uuid({ message: "Contact ID debe ser un UUID válido" }).optional(),
        notes: z.string().trim().max(150).nullable().optional(),
        startDate: z
            .string()
            .refine((date) => !isNaN(Date.parse(date)), { message: "Fecha inválida" })
            .optional(),
        principalAmount: amountSchema().optional(),
        reason: z.string().trim().max(300).optional(),
    })
    .refine((data) => Object.values(data).some((value) => value !== undefined), {
        message: "Debes enviar al menos un campo para actualizar",
    });

export type UpdateLoanOutput = z.output<typeof updateLoanSchema>;

export const cancelLoanSchema = z.object({
    reason: z.string().trim().max(300).optional(),
});

export type CancelLoanOutput = z.output<typeof cancelLoanSchema>;


export const forgiveLoanSchema = z.object({
    amount: amountSchema().optional(),
    date: z
        .string()
        .refine((value) => !isNaN(Date.parse(value)), { message: "Fecha inválida" })
        .optional(),
    reason: z.string().trim().max(300).optional(),
});

export type ForgiveLoanOutput = z.output<typeof forgiveLoanSchema>;


export const updateLoanMovementSchema = z
    .object({
        date: z.string().refine((value) => !isNaN(Date.parse(value)), { message: "Fecha inválida" }).optional(),
        note: z.string().trim().max(300).nullable().optional(),
        reason: z.string().trim().max(300).optional(),
    })
    .refine((data) => Object.values(data).some((value) => value !== undefined), {
        message: "Debes enviar al menos un campo para actualizar",
    });

export type UpdateLoanMovementOutput = z.output<typeof updateLoanMovementSchema>;

export const reverseLoanMovementSchema = z.object({
    date: z.string().refine((value) => !isNaN(Date.parse(value)), { message: "Fecha inválida" }).optional(),
    reason: z.string().trim().max(300).optional(),
});

export type ReverseLoanMovementOutput = z.output<typeof reverseLoanMovementSchema>;
