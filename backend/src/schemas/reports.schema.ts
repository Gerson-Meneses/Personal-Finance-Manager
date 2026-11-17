import { z } from "zod";

const MONTH_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

export const monthlyReportQuerySchema = z.object({
    /** Cantidad de meses hacia atrás, incluyendo el mes final. */
    months: z.coerce
        .number()
        .int("months debe ser un entero")
        .min(1, "months debe ser al menos 1")
        .max(36, "months no puede superar 36")
        .optional(),
    /** Mes final en formato YYYY-MM. Por defecto, el mes actual. */
    endMonth: z
        .string()
        .regex(MONTH_REGEX, "endMonth debe tener formato YYYY-MM")
        .optional(),
});

export type MonthlyReportQuery = z.infer<typeof monthlyReportQuerySchema>;

export const monthlyReportExportQuerySchema = monthlyReportQuerySchema.extend({
    format: z.enum(["csv", "pdf"]).default("csv"),
});

export type MonthlyReportExportQuery = z.infer<typeof monthlyReportExportQuerySchema>;
