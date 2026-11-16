import { apiFetch } from "../../shared/api";
import type { MonthlyReportResponse } from "./types";

export const getMonthlyReport = (months: number, endMonth?: string) => {
    const params = new URLSearchParams({ months: String(months) });
    if (endMonth) params.set("endMonth", endMonth);
    return apiFetch<MonthlyReportResponse>(`/reports/monthly?${params.toString()}`);
};
