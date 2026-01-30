import { z } from 'zod';
import { credentialSchema } from './credential.schema';

export const userSchema = z.object({
    name: z.string().min(2, "El nombre debe tener minimo 2 caracteres").max(99, "El nombre debe tener maximo 99 caracteres"),
    birthDate: z.string().refine((date) => !isNaN(Date.parse(date)), { message: "Invalid date format" }),
    phone: z.string().min(7).max(15).optional().transform((val) => Number(val)).refine((val) => !isNaN(val), { message: "Must be a valid number" }),
    country: z.string().min(2).max(20).optional(),
    isAdmin: z.boolean().default(false),
});

export const userWithCredentialsSchema = userSchema.merge(credentialSchema);

export type UserSchema = z.infer<typeof userSchema>;
export type UserWithCredentials = z.infer<typeof userWithCredentialsSchema>;