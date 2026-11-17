import { z } from "zod";

export const productQuerySchema = z.object({
    search: z.string().trim().max(100).optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().min(1).max(200).optional(),
    order: z.enum(["name", "price", "recent", "purchases"]).optional(),
});

export type ProductQuerySchema = z.infer<typeof productQuerySchema>;

export const productDetailQuerySchema = z.object({
    name: z
        .string({ message: "El nombre del producto es requerido" })
        .trim()
        .min(1, { message: "El nombre del producto es requerido" })
        .max(255, { message: "El nombre del producto es demasiado largo" }),
});

export type ProductDetailQuerySchema = z.infer<typeof productDetailQuerySchema>;
