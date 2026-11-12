import { z } from "zod";

const monthSchema = z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, { message: "El mes debe tener formato YYYY-MM" });

export const budgetQuerySchema = z.object({
    month: monthSchema.optional(),
    lookback: z.preprocess(
        (value) => (value === undefined || value === "" ? undefined : Number(value)),
        z.number().int().min(1).max(12).optional()
    ),
});

export type BudgetQuery = z.infer<typeof budgetQuerySchema>;

const budgetAmountSchema = z
    .number({ message: "El monto es requerido" })
    .nonnegative({ message: "El monto no puede ser negativo" })
    .transform((value) => Math.round(value * 100));

export const upsertBudgetSchema = z.object({
    categoryId: z.uuid({ message: "La categoría es requerida" }),
    month: monthSchema,
    amount: budgetAmountSchema,
});

export type UpsertBudgetOutput = z.output<typeof upsertBudgetSchema>;

export const bulkUpsertBudgetSchema = z.object({
    month: monthSchema,
    items: z
        .array(
            z.object({
                categoryId: z.uuid({ message: "La categoría es requerida" }),
                amount: budgetAmountSchema,
            })
        )
        .min(1, { message: "Agrega al menos un presupuesto" })
        .max(50, { message: "Puedes guardar hasta 50 presupuestos a la vez" }),
});

export type BulkUpsertBudgetOutput = z.output<typeof bulkUpsertBudgetSchema>;
