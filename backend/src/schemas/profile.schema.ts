import { z } from 'zod';
import { userSchema } from './user.schema';

export const updateProfileSchema = z.strictObject({
    name: userSchema.shape.name.optional(),
    birthDate: userSchema.shape.birthDate.optional(),
    phone: z.string({ message: "Phone es requerido" })
        .min(7, { message: "El teléfono debe tener minimo 7 caracteres" })
        .max(15, { message: "El teléfono debe tener maximo 15 caracteres" })
        .transform((val) => Number(val))
        .refine((val) => !isNaN(val), { message: "Must be a valid number" })
        .optional(),
    country: userSchema.shape.country.optional(),
});

export const changeEmailSchema = z.object({
    code: z.string({ message: "El campo 'code' es requerido" }),
    newEmail: z.email({ message: "El campo 'newEmail' es requerido" }).toUpperCase(),
});

export const changePasswordSchema = z.object({
    code: z.string({ message: "El campo 'code' es requerido" }),
    newPassword: z.string({ message: "El campo 'newPassword' es requerido" })
        .trim()
        .min(8, { message: "Mínimo 8 caracteres" })
        .max(16, { message: "Máximo 16 caracteres" })
        .refine(v => !/\s/.test(v), { message: "No debe contener espacios" })
        .refine(v => /[a-z]/.test(v), { message: "Debe tener una minúscula" })
        .refine(v => /[A-Z]/.test(v), { message: "Debe tener una mayúscula" })
        .refine(v => /\d/.test(v), { message: "Debe tener un número" })
        .refine(v => /[!@#$%^&*()_\-+=.]/.test(v), { message: "Debe tener un símbolo válido" }),
});

export type UpdateProfileSchema = z.infer<typeof updateProfileSchema>;
export type ChangeEmailSchema = z.infer<typeof changeEmailSchema>;
export type ChangePasswordSchema = z.infer<typeof changePasswordSchema>;
