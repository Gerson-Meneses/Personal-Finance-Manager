import { API_BASE_URL, apiFetch } from "../../shared/api";
import type {
    CreateChargeInput,
    CreateInstallmentPlanInput,
    CreditCardCharge,
    CreditCardDocument,
    CreditCardPlan,
    CreditCardPlanPreview,
    CreditCardSummary,
    UpdateChargeInput,
} from "./types";

const BASE = "/credit-card";

export const getSummary = (accountId: string) =>
    apiFetch<CreditCardSummary>(`${BASE}/${accountId}/summary`);

export const confirmPending = (
    accountId: string,
    transactionId: string,
    data: { amount?: number; description?: string } = {}
) =>
    apiFetch<{ transaction: unknown }>(`${BASE}/${accountId}/pending/${transactionId}/confirm`, {
        method: "POST",
        body: data,
    });

export const confirmAllPending = (accountId: string) =>
    apiFetch<{ confirmed: number }>(`${BASE}/${accountId}/pending/confirm-all`, {
        method: "POST",
        body: {},
    });

export const previewInstallmentPlan = (
    accountId: string,
    data: CreateInstallmentPlanInput
) =>
    apiFetch<CreditCardPlanPreview>(`${BASE}/${accountId}/installment-plans/preview`, {
        method: "POST",
        body: data,
    });

export const createInstallmentPlan = (
    accountId: string,
    data: CreateInstallmentPlanInput
) =>
    apiFetch<CreditCardPlan>(`${BASE}/${accountId}/installment-plans`, {
        method: "POST",
        body: data,
    });

export const cancelInstallmentPlan = (accountId: string, planId: string) =>
    apiFetch<void>(`${BASE}/${accountId}/installment-plans/${planId}`, {
        method: "DELETE",
    });

export const createCharge = (accountId: string, data: CreateChargeInput) =>
    apiFetch<CreditCardCharge>(`${BASE}/${accountId}/charges`, {
        method: "POST",
        body: data,
    });

export const updateCharge = (
    accountId: string,
    chargeId: string,
    data: UpdateChargeInput
) =>
    apiFetch<CreditCardCharge>(`${BASE}/${accountId}/charges/${chargeId}`, {
        method: "PATCH",
        body: data,
    });

export const deleteCharge = (accountId: string, chargeId: string) =>
    apiFetch<void>(`${BASE}/${accountId}/charges/${chargeId}`, {
        method: "DELETE",
    });

export const listDocuments = (accountId: string) =>
    apiFetch<CreditCardDocument[]>(`${BASE}/${accountId}/documents`);

export const uploadDocument = (
    accountId: string,
    file: File,
    options?: { type?: string; extractedData?: Record<string, unknown> | null }
) => {
    const body = new FormData();
    body.append("file", file);
    if (options?.type) body.append("type", options.type);
    if (options?.extractedData) {
        body.append("extractedData", JSON.stringify(options.extractedData));
    }

    return apiFetch<CreditCardDocument>(`${BASE}/${accountId}/documents`, {
        method: "POST",
        body,
    });
};

export const deleteDocument = (accountId: string, documentId: string) =>
    apiFetch<void>(`${BASE}/${accountId}/documents/${documentId}`, {
        method: "DELETE",
    });

export const downloadDocument = async (accountId: string, doc: CreditCardDocument) => {
    const token = localStorage.getItem("token");
    const response = await fetch(
        `${API_BASE_URL}${BASE}/${accountId}/documents/${doc.id}/download`,
        {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        }
    );

    if (!response.ok) throw new Error("No se pudo descargar el documento");

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = window.document.createElement("a");
    anchor.href = url;
    anchor.download = doc.fileName;
    window.document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
};
