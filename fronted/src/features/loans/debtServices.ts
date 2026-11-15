import { apiFetch } from "../../shared/api";
import type {
    CreateContactPlanInput,
    CreateLoanPlanInput,
    DebtInstallmentItem,
    LoanPlan,
    PayInstallmentInput,
} from "./planTypes";

export const getLoanPlans = (loanId: string) => apiFetch<LoanPlan[]>(`/debt/plans/${loanId}`);

export const createLoanPlan = (loanId: string, data: CreateLoanPlanInput) =>
    apiFetch<LoanPlan>(`/debt/plans/${loanId}`, { method: "POST", body: JSON.stringify(data) });

export const getContactPlans = (contactId: string) =>
    apiFetch<LoanPlan[]>(`/debt/plans/contact/${contactId}`);

export const createContactPlan = (contactId: string, data: CreateContactPlanInput) =>
    apiFetch<LoanPlan>(`/debt/plans/contact/${contactId}`, {
        method: "POST",
        body: JSON.stringify(data),
    });

export const updateLoanPlan = (planId: string, data: Partial<CreateLoanPlanInput>) =>
    apiFetch<LoanPlan>(`/debt/plans/${planId}`, { method: "PATCH", body: JSON.stringify(data) });

export const pauseLoanPlan = (planId: string) =>
    apiFetch<LoanPlan>(`/debt/plans/${planId}/pause`, { method: "POST" });

export const resumeLoanPlan = (planId: string) =>
    apiFetch<LoanPlan>(`/debt/plans/${planId}/resume`, { method: "POST" });

export const cancelLoanPlan = (planId: string, reason?: string) =>
    apiFetch<LoanPlan>(`/debt/plans/${planId}/cancel`, {
        method: "POST",
        body: JSON.stringify({ reason }),
    });

export const getDebtInstallments = (month?: string) =>
    apiFetch<DebtInstallmentItem[]>(`/debt/installments${month ? `?month=${month}` : ""}`);

export const payDebtInstallment = (installmentId: string, data: PayInstallmentInput) =>
    apiFetch(`/debt/installments/${installmentId}/pay`, {
        method: "POST",
        body: JSON.stringify(data),
    });
