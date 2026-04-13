import { z } from 'zod';

export const verifySchema = z.object({
    email: z
    .email({ message: "El campo 'email' es requerido" })
    .toUpperCase(),

    code: z.string()

});

export const resetPasswordSchema = z.object({
    email: z
    .email({ message: "El campo 'email' es requerido" })
    .toUpperCase(),

    code: z.string(),

    newPassword: z.string({ message: "El campo 'password' es requerido" })
        .trim()
        .min(8, { message: "Mínimo 8 caracteres" })
        .max(16, { message: "Máximo 16 caracteres" })
        .refine(v => !/\s/.test(v), { message: "No debe contener espacios" })
        .refine(v => /[a-z]/.test(v), { message: "Debe tener una minúscula" })
        .refine(v => /[A-Z]/.test(v), { message: "Debe tener una mayúscula" })
        .refine(v => /\d/.test(v), { message: "Debe tener un número" })
        .refine(v => /[!@#$%^&*()_\-+=.]/.test(v), { message: "Debe tener un símbolo válido" })

});

export const verifyGenerateSchema = z.object({
    email: z
    .email({ message: "El campo 'email' es requerido" })
    .toUpperCase()
});

export type VerifySchema = z.infer<typeof verifySchema>;
export type VerifyGenerateSchema = z.infer<typeof verifyGenerateSchema>;
export type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>;



