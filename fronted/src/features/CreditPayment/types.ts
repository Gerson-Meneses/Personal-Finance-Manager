import z from "zod";
import { amountSchema, dateSchema, descriptionSchema, timeSchema, uuidSchema } from "../../shared/Schemas/Base.schema";

export const PaymentCreditCardSchema = z.object({
    accountId: uuidSchema("Cuenta de pago"),
    amount: amountSchema(),
    date: dateSchema(),
    time: timeSchema(),
    description: descriptionSchema("Descripción").optional()
})

export type PaymentCreditCardInput = z.input<typeof PaymentCreditCardSchema>
export type PaymentCreditCardOutput = z.output<typeof PaymentCreditCardSchema>