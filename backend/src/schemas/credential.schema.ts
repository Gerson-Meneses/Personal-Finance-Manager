import { z } from 'zod';

export const credentialSchema = z.object({
    email: z.email().toUpperCase(),
    password: z.string()
        .min(8, "Mínimo 8 caracteres")
        .max(16, "Máximo 16 caracteres")
        .refine(v => !/\s/.test(v), "No debe contener espacios")
        .refine(v => /[a-z]/.test(v), "Debe tener una minúscula")
        .refine(v => /[A-Z]/.test(v), "Debe tener una mayúscula")
        .refine(v => /\d/.test(v), "Debe tener un número")
        .refine(v => /[!@#$%^&*()_\-+=.]/.test(v),
            "Debe tener un símbolo válido"
        )

});

export type CredentialSchema = z.infer<typeof credentialSchema>;

