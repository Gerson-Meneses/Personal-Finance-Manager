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
    email: string | null
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
    newPassword: passwordSchema()
})
export type ResetPasswordInput = z.input<typeof ResetPasswordSchema>
export type ResetPasswordOutput = z.output<typeof ResetPasswordSchema>

// ─── Perfil ────────────────────────────────────────────────

const codeSchema = z.string()
    .regex(/^\d{6}$/, { message: "El código debe tener 6 dígitos" })

const changePasswordRules = (label: string = "La contraseña") => z.string({ message: `${label} es requerida` })
    .min(8, `${label} debe tener al menos 8 caracteres`)
    .max(16, `${label} no debe exceder los 16 caracteres`)
    .refine((v) => !/\s/.test(v), `${label} no debe contener espacios`)
    .refine((v) => /[a-z]/.test(v), `${label} debe tener al menos una minúscula`)
    .refine((v) => /[A-Z]/.test(v), `${label} debe tener al menos una mayúscula`)
    .refine((v) => /\d/.test(v), `${label} debe tener al menos un número`)
    .refine((v) => /[!@#$%^&*()_\-+=.]/.test(v), `${label} debe tener al menos un símbolo válido (!@#...)`)

export const UpdateProfileSchema = z.object({
    name: nameSchema("Nombre").optional(),
    birthDate: dateSchema("Cumpleaños").optional(),
    phone: z.string()
        .min(7, { message: "El teléfono debe tener mínimo 7 caracteres" })
        .max(15, { message: "El teléfono debe tener máximo 15 caracteres" })
        .regex(/^\d+$/, { message: "El teléfono debe contener solo números" })
        .optional(),
    country: z.string()
        .trim()
        .min(2, { message: "El país debe tener mínimo 2 caracteres" })
        .max(20, { message: "El país debe tener máximo 20 caracteres" })
        .optional(),
})
export type UpdateProfileInput = z.input<typeof UpdateProfileSchema>
export type UpdateProfileOutput = z.output<typeof UpdateProfileSchema>

export const ChangeEmailSchema = z.object({
    code: codeSchema,
    newEmail: emailSchema("Nuevo email"),
})
export type ChangeEmailInput = z.input<typeof ChangeEmailSchema>
export type ChangeEmailOutput = z.output<typeof ChangeEmailSchema>

export const ChangePasswordSchema = z.object({
    code: codeSchema,
    newPassword: changePasswordRules(),
})
export type ChangePasswordInput = z.input<typeof ChangePasswordSchema>
export type ChangePasswordOutput = z.output<typeof ChangePasswordSchema>

export interface MessageResponse {
    message: string
}

export interface UpdateProfileResponse {
    message: string
    user: User
}

