import { apiFetch } from "../../shared/api"
import type { Data } from "../../shared/dataApiInterface"
import type { CreateLoanPaymentOutput, LoanPayment, QuickpayOutput } from "../LoanPayments/types";

import type {
    Loan,
    LoanQueryFilters,
    LoanSummaryGrouped,
    LoanSummaryQuerySchema,
    CreateLoanOutput,
} from "./types"

const toSearchParams = (query?: object) => {
    if (!query) return "";
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
            params.set(key, String(value));
        }
    });
    return `?${params.toString()}`;
};

export const getLoans = async (query?: LoanQueryFilters): Promise<Data<Loan>> => {
    return await apiFetch<Data<Loan>>(`/loan${toSearchParams(query)}`);
};

export const getSummary = async (query?: LoanSummaryQuerySchema) => {
    const data = await apiFetch<LoanSummaryGrouped[]>(`/loan/summary${toSearchParams(query)}`)
    return data
}

export const createLoan = async (
    body: CreateLoanOutput
): Promise<Loan> => {
    const data = await apiFetch<{ loan: Loan }>("/loan", { method: "POST", body: JSON.stringify(body) })
    return data.loan
}

export const createLoanPayment = async (
    body: CreateLoanPaymentOutput
): Promise<LoanPayment> => {
    const data = await apiFetch<LoanPayment>(`/loan/${body.id}/pay`, { method: "POST", body: JSON.stringify(body) })
    return data
}

export const quickPay = async (body: QuickpayOutput): Promise<void> => {
    await apiFetch(`/loan/quick-pay`, { method: "POST", body: JSON.stringify(body) })
}

export const updateLoan = async (
    id: string,
    body: {
        contactId?: string;
        notes?: string | null;
        startDate?: string;
        principalAmount?: number;
        reason?: string;
    }
): Promise<Loan> => {
    const data = await apiFetch<{ loan: Loan }>(`/loan/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
    });
    return data.loan;
};

export const cancelLoan = async (id: string, reason?: string): Promise<Loan> => {
    const data = await apiFetch<{ loan: Loan }>(`/loan/${id}/cancel`, {
        method: "POST",
        body: JSON.stringify({ reason }),
    });
    return data.loan;
};

export const getLoanAudit = async (id: string) => {
    return apiFetch<Array<{
        id: string;
        action: string;
        entityType: string;
        entityId: string;
        reason?: string | null;
        createdAt: string;
        before?: Record<string, unknown> | null;
        after?: Record<string, unknown> | null;
    }>>(`/loan/${id}/audit`);
};
export const forgiveLoan = async (
    id: string,
    body: { amount?: number; date?: string; reason?: string }
): Promise<Loan> => {
    const data = await apiFetch<{ loan: Loan }>(`/loan/${id}/forgiveness`, {
        method: "POST",
        body: JSON.stringify(body),
    });
    return data.loan;
};

export const updateLoanMovement = async (
    loanId: string,
    movementId: string,
    body: { date?: string; note?: string | null; reason?: string }
) => {
    return apiFetch<LoanPayment>(`/loan/${loanId}/movements/${movementId}`, {
        method: "PATCH",
        body: JSON.stringify(body),
    });
};

export const reverseLoanMovement = async (
    loanId: string,
    movementId: string,
    body: { date?: string; reason?: string }
) => {
    return apiFetch<LoanPayment>(`/loan/${loanId}/movements/${movementId}/reverse`, {
        method: "POST",
        body: JSON.stringify(body),
    });
};
