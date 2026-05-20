import type { Account } from "../accounts/types";
import type { Transaction } from "../transactions/types";

export const loanType = ["RECEIVED", "GIVEN"] as const
export type LoanType = typeof loanType[number]
export type StatusLoan = "PAID" | "PENDING"
export type ExtraPaymentStrategy = 'REDUCE_TERM' | 'REDUCE_INSTALLMENT'


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
}

export interface LoanSummary {
    lender: string,
    type: LoanType,
    totalAmount: number,
    totalPaid: number,
    totalRemaining: number,
    loanCount: number,
    status: StatusLoan
}

export interface CreateLoanDTO {
    lender: string
    amount: number
    type: LoanType
    startDate: string
    date: string
    time?: string
    accountId: string
    description?: string
}

export interface LoanPayment {
    id: string;
    amount: number;
    date: Date;
    description?: string;
    strategy?: ExtraPaymentStrategy;
    transaction?: Transaction;
    account?: Account
}

export interface CreateLoanPaymentDTO {
    id: string
    date: string
    accountId: string
    amount: number
}

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