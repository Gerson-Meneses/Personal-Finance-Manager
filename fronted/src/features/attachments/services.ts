import { API_BASE_URL, apiFetch } from "../../shared/api";
import type { TransactionAttachment } from "../transactions/types";

export const listAttachments = async (transactionId: string): Promise<TransactionAttachment[]> =>
    await apiFetch<TransactionAttachment[]>(`/attachments/transaction/${transactionId}`);

export const uploadAttachment = async (
    transactionId: string,
    file: File
): Promise<TransactionAttachment> => {
    const body = new FormData();
    body.append("file", file);

    return await apiFetch<TransactionAttachment>(`/attachments/transaction/${transactionId}`, {
        method: "POST",
        body,
    });
};

export const deleteAttachment = async (id: string): Promise<void> => {
    await apiFetch<void>(`/attachments/${id}`, { method: "DELETE" });
};

const triggerDownload = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
};

export const downloadAttachment = async (attachment: TransactionAttachment): Promise<void> => {
    const token = localStorage.getItem("token");
    const response = await fetch(
        `${API_BASE_URL}/attachments/${attachment.id}/download`,
        {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        }
    );

    if (!response.ok) {
        if (response.status === 401) {
            localStorage.removeItem("token");
            window.location.href = "/login";
        }
        throw new Error("No se pudo descargar el adjunto");
    }

    triggerDownload(await response.blob(), attachment.fileName);
};
