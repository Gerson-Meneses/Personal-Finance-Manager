import { apiFetch } from "../../shared/api";
import type { BudgetMonth } from "./types";

const BASE = "/budgets";

export const getBudgets = (month?: string) =>
    apiFetch<BudgetMonth>(`${BASE}${month ? `?month=${month}` : ""}`);

export const upsertBudget = (data: { categoryId: string; month: string; amount: number }) =>
    apiFetch(`${BASE}`, { method: "POST", body: data });

export const deleteBudget = (id: string) =>
    apiFetch<void>(`${BASE}/${id}`, { method: "DELETE" });
