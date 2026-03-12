export type LoanType = "RECEIVED" | "GIVEN"

export interface Loan {
    id: string
    lender: string
    principalAmount: number
    type: LoanType
    status: "PENDING" | "PAID"
    payments?: LoanPayment[]
    startDate: string
    createdAt: string
}

export interface CreateLoanDTO {
    lender: string
    principalAmount: number
    type: LoanType
    startDate: string
    accountId: string
}

export interface LoanPayment {
    id: number
    loan: Loan
    amount: number
    date: string
}

export interface CreateLoanPaymentDTO {
    id: string
    date: string
    accountId: string
    amount: number
}