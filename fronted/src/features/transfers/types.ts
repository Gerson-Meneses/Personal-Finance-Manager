import z from "zod"
import { amountSchema, dateSchema, descriptionSchema, timeSchema, uuidSchema } from "../../shared/Schemas/Base.schema"

export const Transfer = z.object({
    amount: amountSchema(),
    date: dateSchema(),
    time: timeSchema(),
    fromAccount: uuidSchema("Cuenta de Origen"),
    toAccount: uuidSchema("Cuenta de destino"),
    description: descriptionSchema().nullish()
})
.refine((data) => data.fromAccount !== data.toAccount, {
    message: "La cuenta de destino no puede ser igual a la cuenta de origen",
    path: ["toAccount"], 
})

export type TransferInput = z.input<typeof Transfer>
export type TransferOutput = z.output<typeof Transfer>