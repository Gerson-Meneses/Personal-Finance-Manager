export type LoanType = "RECEIVED" | "GIVEN"
export type StatusLoan = "PAID" | "PENDING"

export interface Loan {
    id: string;
    lender: string;
    type: LoanType;
    principalAmount: number;
    amountPaid: number;
    amountRemaining: number;
    percentagePaid: number;
    status: StatusLoan;
    startDate: Date;
    lastPaymentDate?: Date;
    paymentCount: number;
    description?: string;
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
    principalAmount: number
    type: LoanType
    startDate: string
    date: string
    time?: string
    accountId: string
    description?: string
}

export interface LoanPayment {
    id: string
    loan: Loan
    amount: number
    date: Date
}

export interface CreateLoanPaymentDTO {
    id: string
    date: string
    accountId: string
    amount: number
}



///////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Types for Loans Module


export interface LoanSummary {
    lender: string;
    type: LoanType;
    totalAmount: number;
    totalPaid: number;
    totalRemaining: number;
    loanCount: number;
    status: StatusLoan;
}

export interface LoanWithProgress {
    id: string;
    lender: string;
    type: LoanType;
    principalAmount: number;
    amountPaid: number;
    amountRemaining: number;
    percentagePaid: number;
    status: StatusLoan;
    startDate: Date;
    lastPaymentDate?: Date;
    paymentCount: number;
    description?: string;
}

export interface CreateLoanDTO {
    lender: string;
    type: LoanType;
    principalAmount: number;
    startDate: string;
    accountId: string;
    description?: string;
    time?: string;
}

export interface PayLoanDTO {
    loanId: string;
    amount: number;
    date: string;
    time: string;
    accountId: string;
    description?: string;
}

export interface QuickPayDTO {
    lender: string;
    type: LoanType;
    amount: number;
    date: string;
    time: string;
    accountId: string;
    description?: string;
}

export interface LoanPayment {
    id: string;
    loanId: string;
    amount: number;
    date: Date;
    time?: string;
    description?: string;
    transactionId: string;
}

// API Response Types
export interface LoanResponse {
    data: LoanWithProgress;
    message: string;
}

export interface LoansListResponse {
    data: LoanWithProgress[];
    total: number;
    page: number;
    limit: number;
}

export interface LoanSummaryResponse {
    data: LoanSummary[];
}

export interface PaymentResponse {
    data: LoanPayment;
    message: string;
}

export interface QuickPayResponse {
    data: LoanPayment[];
    message: string;
}