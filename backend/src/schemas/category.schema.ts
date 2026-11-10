import { z } from 'zod';
import { TypeTransaction } from '../utils/Enums';
import { colord } from "colord";
import { paginationQuerySchema } from "./queryPagination.schema";

const colorSchema = z.string().refine((val) => colord(val).isValid(), {
    message: "Debe ser un color válido (Hex, RGB, HSL o nombre)",
});


export const categorySchema = z.object({
    name: z
        .string({ message: `Se necesita "name" para crear la categoria` })
        .trim()
        .min(3, { message: "El nombre debe tener al menos 2 caracteres" })
        .max(99, { message: "El nombre no puede exceder los 99 caracteres" })
        .toUpperCase(),

    type: z
        .enum(TypeTransaction, { message: `El campo "type" debe ser uno de los siguientes valores: "INCOME" o "EXPENSE"` }),

    color: colorSchema,

    icon: z
        .string({ message: "El campo 'icon' debe ser una cadena de texto" })
        .optional()
        .nullable(),

    visible: z
        .boolean({ message: "El campo 'visible' debe ser un valor booleano" })
        .optional()
        .nullable()
});

export type CategorySchema = z.infer<typeof categorySchema>;

export const updateCategorySchema = categorySchema.omit({ type: true }).partial().refine(
    data => Object.values(data).some(v => v !== undefined),
    { message: "Debes enviar al menos un campo válido para actualizar", path: [], }
)
export type UpdateCategorySchema = z.infer<typeof updateCategorySchema>;

export const suggestQuerySchema = z.object({
    name: z
        .string({ message: 'El campo "name" es requerido' })
        .trim()
        .min(2, { message: "El nombre debe tener al menos 2 caracteres" })
        .max(100, { message: "El nombre no puede exceder los 100 caracteres" }),

    type: z
        .enum(TypeTransaction, { message: `El campo "type" debe ser uno de los siguientes valores: "INCOME" o "EXPENSE"` }),
});

export type SuggestQuerySchema = z.infer<typeof suggestQuerySchema>;

/** Listado de categorías con métricas de uso. `month` = YYYY-MM. */
export const categoryQuerySchema = paginationQuerySchema.extend({
    month: z
        .string()
        .regex(/^\d{4}-(0[1-9]|1[0-2])$/, { message: "El mes debe tener formato YYYY-MM" })
        .optional(),
});

export type CategoryQuerySchema = z.infer<typeof categoryQuerySchema>;