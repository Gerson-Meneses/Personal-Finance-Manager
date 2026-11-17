import { apiFetch } from "../../shared/api";
import type {
    BankLinesQuery,
    BankLinesResponse,
    BankStatementLine,
    CreateFromBankLineInput,
    ImportBankLinesInput,
    ImportBankLinesResult,
} from "./types";

const BASE = "/bank-import";

const toQuery = (query: BankLinesQuery) => {
    const params = new URLSearchParams();
    if (query.accountId) params.set("accountId", query.accountId);
    if (query.status) params.set("status", query.status);
    if (query.limit) params.set("limit", String(query.limit));
    const qs = params.toString();
    return qs ? `?${qs}` : "";
};

export const getBankLines = (query: BankLinesQuery = {}) =>
    apiFetch<BankLinesResponse>(`${BASE}/lines${toQuery(query)}`);

export const importBankLines = (data: ImportBankLinesInput) =>
    apiFetch<ImportBankLinesResult>(`${BASE}/import`, {
        method: "POST",
        body: data,
    });

export const matchBankLine = (lineId: string, transactionId: string) =>
    apiFetch<BankStatementLine>(`${BASE}/lines/${lineId}/match`, {
        method: "POST",
        body: { transactionId },
    });

export const createTransactionFromBankLine = (
    lineId: string,
    data: CreateFromBankLineInput
) =>
    apiFetch<BankStatementLine>(`${BASE}/lines/${lineId}/create`, {
        method: "POST",
        body: data,
    });

export const ignoreBankLine = (lineId: string) =>
    apiFetch<BankStatementLine>(`${BASE}/lines/${lineId}/ignore`, {
        method: "POST",
    });

export const restoreBankLine = (lineId: string) =>
    apiFetch<BankStatementLine>(`${BASE}/lines/${lineId}/restore`, {
        method: "POST",
    });

export const unmatchBankLine = (lineId: string) =>
    apiFetch<BankStatementLine>(`${BASE}/lines/${lineId}/unmatch`, {
        method: "POST",
    });
