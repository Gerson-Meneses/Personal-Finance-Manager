import z from "zod";
import { amountSchema, dateSchema, nameSchema, textSchema, timeSchema } from "./base.schema";
import { TypeLoan } from "../utils/Enums";
import { loanPaymentSchema } from "./loanPayment.schema";

export const quickPaymentSchema = z.object({
    lender: nameSchema("Deudor/Acreedor"),
    type: z.enum(TypeLoan),
}).extend(loanPaymentSchema.shape)

export type QuickPaymentSchema = z.infer<typeof quickPaymentSchema>