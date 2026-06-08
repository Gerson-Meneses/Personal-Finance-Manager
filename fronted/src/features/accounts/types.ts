import z from "zod"
import { amountSchema, colorSchema, nameSchema, percentSchema, rangeSchema, uuidSchema } from "../../shared/Schemas/Base.schema"
import type { Transaction } from "../transactions/types"

export const AccountTypeValues = ["CASH", "CREDIT", "DEBIT"] as const
export type AccountType = typeof AccountTypeValues[number]

export interface BaseAccount {
    id: string
    name: string
    icon: string
    color: string
    type: AccountType,
}

export interface Account extends BaseAccount {
    balance: number,
    creditLimit?: number,
    billingCloseDay?: number,
    paymentDueDay?: number,
    overdraft?: number,
    transactions?: Transaction[]
    /* reccurentTransactions?: ReccurentTransaction[]; */
}

// --- ESQUEMAS DE CREACIÓN ---

export const BaseAccountSchema = z.object({
    name: nameSchema(),
    color: colorSchema().optional(),
    icon: nameSchema().optional(),
})

// Usamos .extend() en lugar de la propagación (...)
export const AccountDebitSchema = BaseAccountSchema.extend({
    type: z.literal("DEBIT")
})

export const AccountCreditSchema = BaseAccountSchema.extend({
    type: z.literal("CREDIT"),
    creditLimit: amountSchema(),
    billingCloseDay: rangeSchema(0, 28, "Fecha de cierre"),
    paymentDueDay: rangeSchema(0, 28, "Fecha de pago"),
    overdraft: percentSchema()
})

export const AccountSchema = z.discriminatedUnion("type", [
    AccountDebitSchema,
    AccountCreditSchema
])

export type AccountSchemaInput = z.input<typeof AccountSchema>
export type AccountSchemaOutput = z.output<typeof AccountSchema>


// --- ESQUEMAS DE ACTUALIZACIÓN ---

// Opción recomendada: El 'type' sigue siendo obligatorio para discriminar, 
// pero el resto de los campos se vuelven opcionales (.partial()).
export const UpdateAccountSchema = z.discriminatedUnion("type", [
    AccountDebitSchema.partial().extend({ 
        type: z.literal("DEBIT"), // Forzamos a que mantenga el literal estricto
        accountId: uuidSchema() 
    }),
    AccountCreditSchema.partial().extend({ 
        type: z.literal("CREDIT"), // Forzamos a que mantenga el literal estricto
        accountId: uuidSchema() 
    })
])

export type UpdateAccountInput = z.input<typeof UpdateAccountSchema>
export type UpdateAccountOutput = z.output<typeof UpdateAccountSchema>