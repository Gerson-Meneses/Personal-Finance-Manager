import type { RecurrenceFrequency } from "../recurring/types";

export type LoanPlanStatus = "ACTIVE" | "PAUSED" | "COMPLETED" | "CANCELLED";
export type DebtInstallmentStatus = "PENDING" | "PARTIAL" | "PAID" | "OVERDUE" | "CANCELLED";

export interface LoanPlanInstallment {
    id: string;
    planId?: string | null;
    loanId?: string | null;
    sequence: number;
    dueDate?: string | null;
    amountDue: number;
    paidAmount: number;
    status: DebtInstallmentStatus;
}

export interface LoanPlan {
    id: string;
    contactId: string;
    loanId?: string | null;
    direction: "GIVEN" | "RECEIVED";
    amountPerInstallment: number;
    frequency: RecurrenceFrequency;
    intervalCount: number;
    startDate: string;
    installmentCount: number;
    status: LoanPlanStatus;
    notes?: string | null;
    installments?: LoanPlanInstallment[];
    contact?: { id: string; name: string };
    loan?: { id: string; lender: string; type: string };
}

export interface DebtInstallmentItem {
    id: string;
    planId?: string | null;
    loanId?: string | null;
    sequence: number;
    dueDate?: string | null;
    amountDue: number;
    paidAmount: number;
    remaining: number;
    status: DebtInstallmentStatus;
    contact?: { id: string; name: string };
    loan?: { id: string; lender: string; type: string };
}

export interface CreateLoanPlanInput {
    amountPerInstallment: number;
    installmentCount: number;
    startDate: string;
    frequency: RecurrenceFrequency;
    intervalCount: number;
    notes?: string;
}

export interface CreateContactPlanInput extends CreateLoanPlanInput {
    direction: "GIVEN" | "RECEIVED";
}

export type ContactPlanInput = CreateContactPlanInput;

export interface PayInstallmentInput {
    amount?: number;
    date: string;
    time?: string;
    accountId: string;
    description?: string;
}
