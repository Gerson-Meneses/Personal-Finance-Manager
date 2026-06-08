import z from "zod";
import type { Transaction } from "../transactions/types";
import { amountSchema, dateSchema, descriptionSchema, nameSchema, timeSchema, uuidSchema } from "../../shared/Schemas/Base.schema";
import type { LoanPayment } from "../LoanPayments/types";

export const LoanTypeValues = ["RECEIVED", "GIVEN"] as const
export type LoanType = typeof LoanTypeValues[number]

export const StatusLoanValues = ["PAID", "PENDING"] as const
export type StatusLoan = typeof StatusLoanValues[number]

export type ExtraPaymentStrategy = 'REDUCE_TERM' | 'REDUCE_INSTALLMENT'

/* ___ Respuesta del Backend _________________________________________________________ */


/* Prestamo */
export interface Loan {
    id: string;
    lender: string;
    type: LoanType;
    principalAmount: number;
    status: StatusLoan;
    startDate: string;
    termInMonths?: number;
    installmentAmount?: number;
    disbursementAmount?: number;
    extraCost?: number;
    tea?: number;

    amountPaid: number;
    amountRemaining: number;
    percentagePaid: number;
    lastPaymentDate?: Date;
    paymentCount: number;
    endPaymentDue?: string;
    description?: string;

    transaction?: Transaction
    payments?: LoanPayment[]

   date?: string; // Campo temporal para unificar fecha en la lista de historia
   amount?: number; // Campo temporal para unificar monto en la lista de historia
}

/* Resumen de préstamos */

export interface LoanSummary {
    lender: string,
    type: LoanType,
    totalAmount: number,
    totalPaid: number,
    totalRemaining: number,
    loanCount: number,
    status: StatusLoan
}

/* ___ Estructutura para crear un préstamo ______________________________________________  */

export const CreateLoanSchema = z.object({
    date: dateSchema().optional(),
    time: timeSchema().optional(),
    startDate: dateSchema(),
    lender: nameSchema("Acreedor/Deudor"),
    type: z.enum(LoanTypeValues),
    description: descriptionSchema().optional(),
    accountId: uuidSchema(),
    amount: amountSchema(),
});

export type CreateLoanInput = z.input<typeof CreateLoanSchema>;
export type CreateLoanOutput = z.output<typeof CreateLoanSchema>;


export interface LoanQueryFilters {
    // Filtros por tipo y estado
    type?: LoanType;
    status?: StatusLoan;

    // Búsqueda por acreedor
    lender?: string;

    // Búsqueda general (acreedor o ID)
    search?: string;

    // Filtros de fecha de inicio del préstamo
    startDate?: string; // YYYY-MM-DD
    from?: string;      // YYYY-MM-DD
    to?: string;        // YYYY-MM-DD

    // Filtros de rango de monto principal
    minAmount?: number;
    maxAmount?: number;

    // Filtros de pagos
    hasPayments?: boolean;
    minPaymentAmount?: number;
    maxPaymentAmount?: number;

    // Filtros de fecha de pagos
    paymentDateFrom?: string; // YYYY-MM-DD
    paymentDateTo?: string;   // YYYY-MM-DD

    // Ordenamiento y paginación
    orderBy?: 'startDate' | 'createdAt' | 'principalAmount';
    order?: 'ASC' | 'DESC';
    page?: number;
    limit?: number;
}

export const initialQuery: LoanQueryFilters = {
    order: "DESC",
    page: 1,
    limit: 20
}

export interface LoanSummaryQuerySchema {
    type?: LoanType,
    status?: StatusLoan,
    excludeCompleted?: boolean,
    excludePaidOff?: boolean,
    lender?: string,
    minRemaining?: number,
    orderBy?: 'totalRemaining' | 'totalAmount' | 'loanCount' | 'lender',
    order?: 'ASC' | 'DESC',
    groupByLender?: boolean,

}

export interface LoanSummaryDetail {
    totalAmount: number;      // Total del principal
    totalPaid: number;        // Total pagado
    totalRemaining: number;   // Total pendiente
    loanCount: number;        // Cantidad de préstamos
    averageRemaining?: number; // Promedio pendiente por préstamo
    progress?: number;        // % de progreso (totalPaid / totalAmount)
}

export interface LoanSummaryGrouped {
    lender: string;
    byType: {
        [key in LoanType]?: LoanSummaryDetail;
    };
    total: LoanSummaryDetail;
}