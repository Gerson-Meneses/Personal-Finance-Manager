import { colord } from "colord";
import { z } from "zod";
import { paginationQuerySchema } from "./queryPagination.schema";

const colorSchema = z.string().refine((val) => colord(val).isValid(), {
    message: "Debe ser un color válido (Hex, RGB, HSL o nombre)",
});

export const tagSchema = z.object({
    name: z
        .string({ message: `Se necesita "name" para crear la etiqueta` })
        .trim()
        .min(2, { message: "El nombre debe tener al menos 2 caracteres" })
        .max(50, { message: "El nombre no puede exceder los 50 caracteres" }),

    color: colorSchema.optional(),
});

export type TagSchema = z.infer<typeof tagSchema>;

export const updateTagSchema = tagSchema
    .partial()
    .refine(
        (data) => Object.values(data).some((value) => value !== undefined),
        { message: "Debes enviar al menos un campo válido para actualizar", path: [] }
    );

export type UpdateTagSchema = z.infer<typeof updateTagSchema>;

export const tagQuerySchema = paginationQuerySchema.extend({
    search: z.string().trim().max(50).optional(),
});

export type TagQuerySchema = z.infer<typeof tagQuerySchema>;
