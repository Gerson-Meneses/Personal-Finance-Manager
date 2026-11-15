import { apiFetch } from "../../shared/api";
import type { Contact } from "./types";

const BASE = "/contacts";

export const getContacts = () => apiFetch<Contact[]>(BASE);

export const createContact = (data: { name: string; notes?: string }) =>
    apiFetch<Contact>(BASE, { method: "POST", body: JSON.stringify(data) });

export const updateContact = (id: string, data: { name?: string; notes?: string | null; archived?: boolean }) =>
    apiFetch<Contact>(`${BASE}/${id}`, { method: "PATCH", body: JSON.stringify(data) });

export const mergeContacts = (id: string, targetContactId: string) =>
    apiFetch<Contact>(`${BASE}/${id}/merge`, {
        method: "POST",
        body: JSON.stringify({ targetContactId }),
    });
