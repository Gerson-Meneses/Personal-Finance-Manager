import { z } from "zod"

export const transferSchema = z.object({
    amount: z.number({message:"Debe ser un número."}).positive({ message: "La cantidad minima son 10 centavos." }).min(0.1, { message: "La cantidad minima son 10 centavos." }).transform(n => n * 100),
    date: z.string().refine((date) => !isNaN(Date.parse(date)), { message: "Formato incorrecto de fecha" }),
    time: z.string().optional(),
    fromAccount: z.uuid({message:"Cuenta de origen requerida"}),
    toAccount: z.uuid({message:"Cuenta de destino requerida"}),
    description: z.string().optional()
});

export type TransferSchema = z.infer<typeof transferSchema>;