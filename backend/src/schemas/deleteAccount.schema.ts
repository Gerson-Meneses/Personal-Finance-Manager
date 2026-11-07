import { z } from 'zod';

export const deleteAccountSchema = z.object({
    code: z.string({ message: "El campo 'code' es requerido" })
        .regex(/^\d{6}$/, { message: "El código debe tener 6 dígitos" })
});

export type DeleteAccountSchema = z.infer<typeof deleteAccountSchema>;
