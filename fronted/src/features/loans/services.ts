import { apiFetch } from "../../shared/api"
import type { Data } from "../../shared/dataApiInterface"
import type { QuickPayDTO } from "./LoanPayments/types";
import type {
    Loan,
    CreateLoanDTO,
    CreateLoanPaymentDTO,
    LoanPayment,
    LoanQueryFilters,
    LoanSummaryGrouped,
    LoanSummaryQuerySchema
} from "./types"

export const getLoans = async (query?: LoanQueryFilters): Promise<Data<Loan>> => {
    const searchParams = query ? `?${new URLSearchParams(query as any).toString()}` : "";
    return await apiFetch<Data<Loan>>(`/loan${searchParams}`);
};

export const getSummary = async (query?: LoanSummaryQuerySchema) => {
    const searchParams = query ? `?${new URLSearchParams(query as any).toString()}` : "";
    const data = await apiFetch<LoanSummaryGrouped[]>(`/loan/summary${searchParams}`)
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
    body: CreateLoanDTO
): Promise<Loan> => {
    const data = await apiFetch<Loan>("/loan", { method: "POST", body: JSON.stringify(body) })
    return data
}

export const createLoanPayment = async (
    body: CreateLoanPaymentDTO
): Promise<LoanPayment> => {
    const data = await apiFetch<LoanPayment>(`/loan/${body.id}/pay`, { method: "POST", body: JSON.stringify(body) })
    return data
}

export const quickPay = async (body: QuickPayDTO): Promise<void> => {
    await apiFetch(`/loan/quick-pay`, { method: "POST", body: JSON.stringify(body) })
}

export const deleteLoan = async (id: string) => {
    await apiFetch<void>(`/loan/${id}`, {
        method: "DELETE",
    })
}