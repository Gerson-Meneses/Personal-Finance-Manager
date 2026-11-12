import { apiFetch } from "../../shared/api";
import type { BudgetMonth, BudgetSuggestionResponse } from "./types";

const BASE = "/budgets";

export const getBudgets = (month?: string) =>
    apiFetch<BudgetMonth>(`${BASE}${month ? `?month=${month}` : ""}`);

export const getBudgetSuggestions = (month?: string, lookback = 3) => {
    const params = new URLSearchParams();
    if (month) params.set("month", month);
    params.set("lookback", String(lookback));
    return apiFetch<BudgetSuggestionResponse>(`${BASE}/suggestions?${params.toString()}`);
};

export const upsertBudget = (data: { categoryId: string; month: string; amount: number }) =>
    apiFetch(`${BASE}`, { method: "POST", body: data });

export const bulkUpsertBudgets = (data: {
    month: string;
    items: { categoryId: string; amount: number }[];
}) => apiFetch<BudgetMonth>(`${BASE}/bulk`, { method: "POST", body: data });

export const deleteBudget = (id: string) =>
    apiFetch<void>(`${BASE}/${id}`, { method: "DELETE" });
