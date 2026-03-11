import { z } from "zod"

export const paginationQuerySchema = z.object({
    page: z
        .string()
        .transform(Number)
        .refine((v) => v > 0, 'page must be > 0')
        .optional(),

    limit: z
        .string()
        .transform(Number)
        .refine((v) => v > 0 && v <= 100, 'limit must be between 1 and 100')
        .optional(),

    order: z.enum(['ASC', 'DESC']).optional(),
})

export type PaginationQuerySchema = z.infer<typeof paginationQuerySchema>