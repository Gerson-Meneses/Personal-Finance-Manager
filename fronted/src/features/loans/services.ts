import { apiFetch } from "../../shared/api"
import type { Data } from "../../shared/dataApiInterface"
import type {
    Loan,
    CreateLoanDTO,
    CreateLoanPaymentDTO,
    LoanPayment
} from "./types"

export const getLoans = async (): Promise<Loan[]> => {
    const { data } = await apiFetch<Data<Loan>>("/loan")
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

export const deleteLoan = async (id: string) => {
    await apiFetch<void>(`/loan/${id}`, {
        method: "DELETE",
    })
}