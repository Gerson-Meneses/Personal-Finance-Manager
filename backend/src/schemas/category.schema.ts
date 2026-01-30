import { z } from 'zod';
import { TypeTransaction } from '../utils/Enums';


export const categorySchema = z.object({
    name: z.string().min(2).max(99).toUpperCase(),
    type: z.enum(TypeTransaction),
    color: z.string().min(3).optional(),
    icon: z.string().optional()
});

export type CategorySchema = z.infer<typeof categorySchema>;