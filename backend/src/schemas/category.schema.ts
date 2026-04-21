import { z } from 'zod';
import { TypeTransaction } from '../utils/Enums';
import { colord } from "colord";

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