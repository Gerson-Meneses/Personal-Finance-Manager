import { z } from "zod";

const monthSchema = z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, { message: "El mes debe tener formato YYYY-MM" });

export const budgetQuerySchema = z.object({
    month: monthSchema.optional(),
});

export type BudgetQuery = z.infer<typeof budgetQuerySchema>;

export const upsertBudgetSchema = z.object({
    categoryId: z.uuid({ message: "La categoría es requerida" }),
    month: monthSchema,
    amount: z
        .number({ message: "El monto es requerido" })
        .nonnegative({ message: "El monto no puede ser negativo" })
        .transform((value) => Math.round(value * 100)),
});

export type UpsertBudgetOutput = z.output<typeof upsertBudgetSchema>;
