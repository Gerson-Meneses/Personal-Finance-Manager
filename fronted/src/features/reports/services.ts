import { apiFetch, downloadApiFile } from "../../shared/api";
import type { MonthlyReportResponse } from "./types";

const reportParams = (months: number, endMonth?: string) => {
    const params = new URLSearchParams({ months: String(months) });
    if (endMonth) params.set("endMonth", endMonth);
    return params;
};

export const getMonthlyReport = (months: number, endMonth?: string) => {
    const params = reportParams(months, endMonth);
    return apiFetch<MonthlyReportResponse>(`/reports/monthly?${params.toString()}`);
};

export const exportMonthlyReport = (
    format: "csv" | "pdf",
    months: number,
    endMonth?: string
): Promise<string> => {
    const params = reportParams(months, endMonth);
    params.set("format", format);
    return downloadApiFile(
        `/reports/monthly/export?${params.toString()}`,
        `reporte.${format}`
    );
};
