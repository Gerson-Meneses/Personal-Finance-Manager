import { z } from "zod"

export const dashboardQuerySchema = z.object({
    day: z.string().transform(Number).refine((v) => v > 0 && v <= 31, '"day" debe ser entre 1 y 31').optional(),
    toDay: z.string().transform(Number).refine((v) => v > 0 && v <= 31, '"toDay" debe ser entre 1 y 31').optional(),
    month: z.string().transform(Number).refine((v) => v > 0 && v <= 12, '"month" debe ser entre 1 y 12').optional(),
    toMonth: z.string().transform(Number).refine((v) => v > 0 && v <= 12, '"toMonth" debe ser entre 1 y 12').optional(),
    exactMonth: z.string().transform(Number).refine((v) => v > 0 && v <= 12, '"exactMonth" debe ser entre 1 y 12').optional(),
    year: z.string().transform(Number).refine((v) => v > 1900 && v <= new Date().getFullYear(), `"/year" debe ser entre 1900 y ${new Date().getFullYear()}`).optional(),
    toYear: z.string().transform(Number).refine((v) => v > 1900 && v <= new Date().getFullYear(), `"/toYear" debe ser entre 1900 y ${new Date().getFullYear()}`).optional(),
    recentsTransactions: z.string().transform(Number).refine((v) => v > 0 && v <= 100, '"recentsTransactions" debe ser entre 1 y 100').optional(),
})

export type DashboardQuerySchema = z.infer<typeof dashboardQuerySchema>