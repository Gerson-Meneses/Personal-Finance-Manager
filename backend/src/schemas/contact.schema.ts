import { z } from "zod";

export const createContactSchema = z.object({
    name: z.string().trim().min(3, "El nombre debe tener al menos 3 caracteres").max(100),
    notes: z.string().trim().max(500).optional(),
});

export type CreateContactOutput = z.output<typeof createContactSchema>;

export const updateContactSchema = z
    .object({
        name: z.string().trim().min(3).max(100).optional(),
        notes: z.string().trim().max(500).nullable().optional(),
        archived: z.boolean().optional(),
    })
    .refine((data) => Object.values(data).some((value) => value !== undefined), {
        message: "Debes enviar al menos un campo para actualizar",
    });

export type UpdateContactOutput = z.output<typeof updateContactSchema>;

export const mergeContactsSchema = z.object({
    targetContactId: z.uuid({ message: "El contacto destino es requerido" }),
});

export type MergeContactsOutput = z.output<typeof mergeContactsSchema>;
