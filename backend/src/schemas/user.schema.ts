import { z } from 'zod';
import { credentialSchema } from './credential.schema';

export const userSchema = z.object({
    name: z.string({ message: "Name es requerido" }).trim().min(3, { message: "El nombre debe tener minimo 3 caracteres" }).max(99, { message: "El nombre debe tener maximo 99 caracteres" }),
    birthDate: z.string({ message: "Birth Date es requerido" }).refine((date) => !isNaN(Date.parse(date)), { message: "Invalid date format" }),
    phone: z.string({ message: "Phone es requerido" }).min(7, { message: "El teléfono debe tener minimo 7 caracteres" }).max(15, { message: "El teléfono debe tener maximo 15 caracteres" }).optional().transform((val) => Number(val)).refine((val) => !isNaN(val), { message: "Must be a valid number" }),
    country: z.string({ message: "Country es requerido" }).min(2, { message: "El país debe tener minimo 2 caracteres" }).max(20, { message: "El país debe tener maximo 20 caracteres" }).optional(),
    isAdmin: z.boolean({ message: "Is Admin es requerido" }).default(false),
});

export const userWithCredentialsSchema = userSchema.merge(credentialSchema);

export type UserSchema = z.infer<typeof userSchema>;
export type UserWithCredentials = z.infer<typeof userWithCredentialsSchema>;