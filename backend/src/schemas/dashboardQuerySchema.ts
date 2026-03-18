import { z } from "zod"

export const dashboardQuerySchema = z.object({
    day: z.string().transform(Number).refine((v) => v > 0 && v <= 31, 'day must be between 1 and 31').optional(),
    toDay: z.string().transform(Number).refine((v) => v > 0 && v <= 31, 'toDay must be between 1 and 31').optional(),
    month: z.string().transform(Number).refine((v) => v > 0 && v <= 12, 'month must be between 1 and 12').optional(),
    toMonth: z.string().transform(Number).refine((v) => v > 0 && v <= 12, 'toMonth must be between 1 and 12').optional(),
    exactMonth: z.string().transform(Number).refine((v) => v > 0 && v <= 12, 'exactMonth must be between 1 and 12').optional(),
    year: z.string().transform(Number).refine((v) => v > 1900 && v <= new Date().getFullYear(), `year must be between 1900 and ${new Date().getFullYear()}`).optional(),
    toYear: z.string().transform(Number).refine((v) => v > 1900 && v <= new Date().getFullYear(), `toYear must be between 1900 and ${new Date().getFullYear()}`).optional(),
    recentsTransactions: z.string().transform(Number).refine((v) => v > 0 && v <= 100, 'recentsTransactions must be between 1 and 100').optional(),
})

export type DashboardQuerySchema = z.infer<typeof dashboardQuerySchema>