import { z } from "zod"
import { amountSchema, dateSchema, descriptionSchema, nameSchema, timeSchema, uuidSchema } from "../../../shared/Schemas/Base.schema"
import dayjs from "dayjs"

export const CreatePaymentSchema = z.object({
    id: uuidSchema(),
    date: dateSchema(),
    accountId: uuidSchema(),
    amount: amountSchema()
})

export type CreatePaymentDTO = z.infer<typeof CreatePaymentSchema>

export const initialLoanPayment: CreatePaymentDTO = {
    id: '',
    date: dayjs().format("YYYY-MM-DD"),
    accountId: '',
    amount: 0
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

export type QuickPayDTO = z.infer<typeof QuickPaySchema>

export const initialQuickPay: QuickPayDTO = {
    lender: '',
    type: "GIVEN",
    amount: 0,
    date: dayjs().format("YYYY-MM-DD"),
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
    type: undefined,
    status: undefined,
    lender: undefined,
    search: undefined,
    startDate: undefined,
    from: undefined,
    to: undefined,
    minAmount: undefined,
    maxAmount: undefined,
    hasPayments: undefined,
    minPaymentAmount: undefined,
    maxPaymentAmount: undefined,
    paymentDateFrom: undefined,
    paymentDateTo: undefined,
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