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

export const getByLender = async (lender: string, type?: string) => {
    const encodedLender = encodeURIComponent(lender);
    const data = await apiFetch<Loan[]>(`/loan/lender/${encodedLender}`);
    if (type) {
        return data.filter(loan => loan.type === type);
    }
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

export const deleteLoan = async (id: string) => {
    await apiFetch<void>(`/loan/${id}`, {
        method: "DELETE",
    })
}