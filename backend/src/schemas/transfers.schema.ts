import { z } from "zod"

export const transferSchema = z.object({
    amount: z.number().positive().min(10, { message: "La cantidad minima son 10 centavos." }).transform(n => n * 100),
    date: z.string().refine((date) => !isNaN(Date.parse(date)), { message: "Invalid date format" }),
    time: z.string().optional(),
    fromAccount: z.string().uppercase(),
    toAccount: z.string().uppercase(),
    description: z.string().optional()
});

export type TransferSchema = z.infer<typeof transferSchema>;