import { apiFetch } from "../../shared/api";
import type {
    PaymentNotification,
    RecurringMonthProjection,
    RecurringOccurrence,
    RecurringPayment,
    RecurringPaymentFormOutput,
    RecurringPaymentUpdate,
} from "./types";

const BASE = "/recurring-payments";

export const getRecurringPayments = () => apiFetch<RecurringPayment[]>(BASE);

export const getRecurringProjection = (month?: string) =>
    apiFetch<RecurringMonthProjection>(`${BASE}/projection${month ? `?month=${month}` : ""}`);

export const createRecurringPayment = (data: RecurringPaymentFormOutput) =>
    apiFetch<RecurringPayment>(BASE, { method: "POST", body: data });

export const updateRecurringPayment = (id: string, data: RecurringPaymentUpdate) =>
    apiFetch<RecurringPayment>(`${BASE}/${id}`, { method: "PATCH", body: data });

export const deleteRecurringPayment = (id: string) =>
    apiFetch<void>(`${BASE}/${id}`, { method: "DELETE" });

export const executeRecurringOccurrence = (id: string, data: { accountId?: string; date?: string; time?: string } = {}) =>
    apiFetch<RecurringOccurrence>(`${BASE}/occurrences/${id}/execute`, { method: "POST", body: data });

export const skipRecurringOccurrence = (id: string, reason?: string) =>
    apiFetch<RecurringOccurrence>(`${BASE}/occurrences/${id}/skip`, { method: "POST", body: { reason } });

export const processDueRecurringPayments = () =>
    apiFetch<{ processed: number; failed: number }>(`${BASE}/process-due`, { method: "POST" });

export const getPaymentNotifications = (unreadOnly = false) =>
    apiFetch<PaymentNotification[]>(`/notifications${unreadOnly ? "?unread=true" : ""}`);

export const markNotificationRead = (id: string) =>
    apiFetch<{ message: string }>(`/notifications/${id}/read`, { method: "PATCH" });

export const markAllNotificationsRead = () =>
    apiFetch<{ message: string }>(`/notifications/read-all`, { method: "PATCH" });
