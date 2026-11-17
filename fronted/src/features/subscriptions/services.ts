import { apiFetch } from "../../shared/api";
import type { SubscriptionHubResponse } from "./types";

const BASE = "/recurring-payments";

export const getSubscriptionHub = () =>
    apiFetch<SubscriptionHubResponse>(`${BASE}/subscriptions`);

export const setSubscriptionActive = (id: string, isActive: boolean) =>
    apiFetch(`${BASE}/${id}`, {
        method: "PATCH",
        body: { isActive },
    });
