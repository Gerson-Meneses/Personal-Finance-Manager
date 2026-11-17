import { z } from "zod";
import { colorSchema } from "../../shared/Schemas/Base.schema";

export const TagSchema = z.object({
    name: z
        .string({ message: "El nombre es requerido" })
        .trim()
        .min(2, { message: "El nombre debe tener al menos 2 caracteres" })
        .max(50, { message: "El nombre no puede exceder los 50 caracteres" }),
    color: colorSchema().optional(),
});

export type TagInput = z.input<typeof TagSchema>;
export type TagOutput = z.output<typeof TagSchema>;

export interface UpdateTagInput extends TagOutput {
    tagId: string;
}

export interface Tag {
    id: string;
    name: string;
    color: string;
    usageCount?: number;
    createdAt?: string;
    updatedAt?: string;
}
