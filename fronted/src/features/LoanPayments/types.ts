import { z } from "zod"
import { amountSchema, dateSchema, descriptionSchema, nameSchema, timeSchema, uuidSchema } from "../../shared/Schemas/Base.schema"
import dayjs from "dayjs"
import type { Account } from "../accounts/types";
import type { Transaction } from "../transactions/types";
import type { ExtraPaymentStrategy } from "../loans/types";

export interface LoanPayment {
    id: string;
    amount: number;
    date: string;
    description?: string;
    strategy?: ExtraPaymentStrategy;
    transaction?: Transaction;
    account?: Account
}

export const CreateLoanPaymentSchema = z.object({
    id: uuidSchema(),
    date: dateSchema(),
    time: timeSchema().optional(),
    accountId: uuidSchema(),
    amount: amountSchema(),
    description: descriptionSchema().optional()
})

export type CreateLoanPaymentInput = z.input<typeof CreateLoanPaymentSchema>;
export type CreateLoanPaymentOutput = z.output<typeof CreateLoanPaymentSchema>;

export const initialLoanPayment: CreateLoanPaymentInput = {
    id: '',
    date: dayjs().format("YYYY-MM-DD"),
    time: dayjs().format("HH:mm"),
    accountId: '',
    amount: 0,
    description: ''
}

export const QuickPaySchema = z.object({
    lender: nameSchema(),
    type: z.enum(["RECEIVED", "GIVEN"]),
    amount: amountSchema(),
    date: dateSchema(),
    time: timeSchema().optional(),
    accountId: uuidSchema(),
    description: descriptionSchema().optional()
})

export type QuickpayInput = z.input<typeof QuickPaySchema>
export type QuickpayOutput = z.output<typeof QuickPaySchema>


export const initialQuickPay: QuickpayInput = {
    lender: '',
    type: "GIVEN",
    amount: 0,
    date: dayjs().format("YYYY-MM-DD"),
    time: dayjs().format("HH:mm"),
    accountId: '',
    description: ''
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


// ============ LOAN QUERY FILTERS SCHEMA ============
export const LoanQueryFiltersSchema = z.object({
    // Filtros por tipo y estado
    type: z.enum(["RECEIVED", "GIVEN"]).optional(),
    status: z.enum(["PAID", "PENDING"]).optional(),

    // Búsqueda por acreedor
    lender: nameSchema().optional(),

    // Búsqueda general
    search: z.string().min(1).max(100).optional(),

    // Filtros de fecha de inicio del préstamo
    startDate: dateSchema().optional(),
    from: dateSchema().optional(),
    to: dateSchema().optional(),

    // Filtros de rango de monto principal
    minAmount: z.number().min(0).optional(),
    maxAmount: z.number().min(0).optional(),

    // Filtros de pagos
    hasPayments: z.boolean().optional(),
    minPaymentAmount: z.number().min(0).optional(),
    maxPaymentAmount: z.number().min(0).optional(),

    // Filtros de fecha de pagos
    paymentDateFrom: dateSchema().optional(),
    paymentDateTo: dateSchema().optional(),

    // Ordenamiento y paginación
    orderBy: z.enum(['startDate', 'createdAt', 'principalAmount']).optional(),
    order: z.enum(['ASC', 'DESC']).optional(),
    page: z.number().min(1).optional(),
    limit: z.number().min(5).max(100).optional(),
}).strict()

export type LoanQueryFiltersFormInput = z.infer<typeof LoanQueryFiltersSchema>

// ============ LOAN SUMMARY FILTERS SCHEMA ============
export const LoanSummaryFiltersSchema = z.object({
    type: z.enum(["RECEIVED", "GIVEN"]).optional(),
    status: z.enum(["PAID", "PENDING"]).optional(),
    excludeCompleted: z.boolean().optional(),
    excludePaidOff: z.boolean().optional(),
    lender: nameSchema().optional(),
    minRemaining: z.number().min(0).optional(),
    orderBy: z.enum(['totalRemaining', 'totalAmount', 'loanCount', 'lender']).optional(),
    order: z.enum(['ASC', 'DESC']).optional(),
    groupByLender: z.boolean().optional(),
}).strict()

export type LoanSummaryFiltersFormInput = z.infer<typeof LoanSummaryFiltersSchema>

// ============ VALORES POR DEFECTO ============
export const defaultLoanQueryFilters: LoanQueryFiltersFormInput = {
    orderBy: 'startDate',
    order: 'DESC',
    page: 1,
    limit: 20,
}

export const defaultLoanSummaryFilters: LoanSummaryFiltersFormInput = {
    type: undefined,
    status: undefined,
    excludeCompleted: undefined,
    excludePaidOff: undefined,
    lender: undefined,
    minRemaining: undefined,
    orderBy: 'totalRemaining',
    order: 'DESC',
    groupByLender: false,
}