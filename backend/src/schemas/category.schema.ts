import { z } from 'zod';
import { TypeTransaction } from '../utils/Enums';


export const categorySchema = z.object({
    name: z.string({ message: `Se necesita "name" para crear la categoria` }).min(2, { message: "El nombre debe tener al menos 2 caracteres" }).max(99, { message: "El nombre no puede exceder los 99 caracteres" }).toUpperCase().trim(),
    type: z.enum(TypeTransaction, { message: `El campo "type" debe ser uno de los siguientes valores: "INCOME" o "EXPENSE"` }),
    color: z.string().min(3).refine(value => /^#[0-9A-Fa-f]{6}$/.test(value), { message: "El color debe tener un formato hexadecimal válido (#RRGGBB)" }).optional(),
    icon: z.string().optional(),
    visible: z.boolean().optional()
});

export type CategorySchema = z.infer<typeof categorySchema>;

export const updateCategorySchema = categorySchema.omit({ type: true }).partial().refine(
    data => Object.values(data).some(v => v !== undefined),
    { message: "Debes enviar al menos un campo válido para actualizar", path: [], }
)
export type UpdateCategorySchema = z.infer<typeof updateCategorySchema>;