import z from "zod"
import {
    amountSchema,
    colorSchema,
    emptyToUndefined,
    nameSchema,
    percentSchema,
    rangeSchema,
    uuidSchema,
} from "../../shared/Schemas/Base.schema"
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
    tea?: number,
    tcea?: number,
    desgravamenRate?: number,
    desgravamenMaxAmount?: number,
    currency?: string,
    issuer?: string,
    brand?: string,
    last4?: string,
    holderName?: string,
    transactions?: Transaction[]
    /* reccurentTransactions?: ReccurentTransaction[]; */
}

const optionalRate = (max = 1000, label = "Tasa") =>
    z.preprocess(
        emptyToUndefined,
        z.coerce
            .number({ message: `${label} debe ser numérica` })
            .nonnegative({ message: `${label} no puede ser negativa` })
            .max(max, `${label} parece demasiado alta`)
            .optional()
    )

const optionalMoney = (label = "Monto") =>
    z.preprocess(
        emptyToUndefined,
        z.coerce
            .number({ message: `${label} debe ser numérico` })
            .nonnegative({ message: `${label} no puede ser negativo` })
            .optional()
    )

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
    billingCloseDay: rangeSchema(1, 31, "Fecha de cierre"),
    paymentDueDay: rangeSchema(1, 31, "Fecha de pago"),
    overdraft: percentSchema(),
    tea: optionalRate(1000, "La TEA"),
    tcea: optionalRate(1000, "La TCEA"),
    desgravamenRate: optionalRate(100, "El seguro de desgravamen"),
    desgravamenMaxAmount: optionalMoney("El tope del seguro"),
    currency: z.preprocess(
        emptyToUndefined,
        z.string().trim().length(3, "La moneda debe tener 3 letras").optional()
    ),
    issuer: z.preprocess(
        emptyToUndefined,
        z.string().trim().max(100, "El banco emisor no puede exceder 100 caracteres").optional()
    ),
    brand: z.preprocess(
        emptyToUndefined,
        z.string().trim().max(30, "La marca no puede exceder 30 caracteres").optional()
    ),
    last4: z.preprocess(
        emptyToUndefined,
        z.string().trim().regex(/^\d{4}$/, "Deben ser exactamente 4 dígitos").optional()
    ),
    holderName: z.preprocess(
        emptyToUndefined,
        z.string().trim().max(150, "El titular no puede exceder 150 caracteres").optional()
    ),
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
