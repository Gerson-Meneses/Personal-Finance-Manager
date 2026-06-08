import z from "zod";
import type { Account } from "../accounts/types";
import type { Category } from "../categories/types";
import { booleanSchema, dateSchema, emailSchema, nameSchema, passwordSchema, phoneSchema } from "../../shared/Schemas/Base.schema";

export interface User {
    id: string;
    name: string;
    birthDate: string,
    phone: string,
    country: string | null,
    isAdmin: boolean,
    createdAt: string,
    updatedAt: string,
    is_verified: boolean
    accounts: Account[],
    categories: Category[]
}

export interface DataAuth {
    message: string
    user: {
        sub: string
        email: string
        role: string
        exp: number
    }
    token: string
}

export const RegisterSchema = z.object({
    name: nameSchema("Nombre de Usuario"),
    birthDate: dateSchema("Cumpleaños"),
    phone: phoneSchema(),
    country: nameSchema("Pais").optional(),
    isAdmin: booleanSchema().nullish(),
    email: emailSchema(),
    password: passwordSchema()
})

export type RegisterInput = z.input<typeof RegisterSchema>
export type RegisterOotput = z.output<typeof RegisterSchema>


export const LoginSchema = z.object({
    email: emailSchema(),
    password: passwordSchema()
})

export type LoginInput = z.input<typeof LoginSchema>
export type LoginOutput = z.output<typeof LoginSchema>

export const VerifyEmailRequestSchema = z.object({
    email: emailSchema()
})
export type VerifyEmailRequestInput = z.input<typeof VerifyEmailRequestSchema>
export type VerifyEmailRequestOutput = z.output<typeof VerifyEmailRequestSchema>

export const VerifyEmailCodeSchema = z.object({
    email: emailSchema(),
    code: z.string().min(6, { message: "Formato de codido Invalido" }).max(6, { message: "Formato de codido Invalido" })
})
export type VerifyEmailCodeInput = z.input<typeof VerifyEmailCodeSchema>
export type VerifyEmailCodeOutput = z.output<typeof VerifyEmailCodeSchema>

export const ResetPasswordSchema = z.object({
    email: emailSchema(),
    code: z.string().min(6, { message: "Formato de codido Invalido" }).max(6, { message: "Formato de codido Invalido" }),
    newPAssword: passwordSchema()
})
export type ResetPasswordInput = z.input<typeof ResetPasswordSchema>
export type ResetPasswordOutput = z.output<typeof ResetPasswordSchema>

