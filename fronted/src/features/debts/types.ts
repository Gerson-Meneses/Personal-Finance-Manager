import type { Contact } from "../contacts/types";
import type { DebtInstallmentItem } from "../loans/planTypes";
import type { Loan, LoanSummaryGrouped } from "../loans/types";

export interface ContactDebtRow {
    id: string;
    contactId: string | null;
    name: string;
    notes?: string | null;
    archived: boolean;
    summary?: LoanSummaryGrouped;
    loans: Loan[];
    installments: DebtInstallmentItem[];
    given: number;
    received: number;
    net: number;
    totalAmount: number;
    totalPaid: number;
    loanCount: number;
    overdueCount: number;
    nextDueDate: string | null;
    contact?: Contact;
}

export interface DebtHubSummary {
    given: number;
    received: number;
    net: number;
    activeLoans: number;
    people: number;
    overdue: number;
}

export interface DebtHub {
    rows: ContactDebtRow[];
    loans: Loan[];
    installments: DebtInstallmentItem[];
    contacts: Contact[];
    summary: DebtHubSummary;
    currentMonth: string;
}
