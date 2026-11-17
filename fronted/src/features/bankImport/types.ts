import type { TransactionType } from "../transactions/types";

export const BANK_LINE_STATUSES = [
    "PENDING",
    "MATCHED",
    "IMPORTED",
    "IGNORED",
] as const;

export type BankLineStatus = (typeof BANK_LINE_STATUSES)[number];

export interface BankLineCategory {
    id: string;
    name: string;
    color: string;
    icon?: string | null;
}

export interface BankLineTransaction {
    id: string;
    name: string;
    amount: number;
    date: string;
    type: TransactionType;
    category?: BankLineCategory | null;
    account?: { id: string; name: string } | null;
}

export interface BankLineSuggestion {
    score: number;
    dayDiff: number;
    reasons: string[];
    transaction: BankLineTransaction;
}

export interface BankStatementLine {
    id: string;
    accountId: string;
    account?: { id: string; name: string; type: string } | null;
    date: string;
    description: string;
    amount: number;
    type: "INCOME" | "EXPENSE";
    reference: string | null;
    balanceAfter: number | null;
    status: BankLineStatus;
    transactionId: string | null;
    transaction: BankLineTransaction | null;
    importBatchId: string;
    matchedAt: string | null;
    createdAt: string;
    suggestions: BankLineSuggestion[];
}

export interface BankLinesSummary {
    pending: number;
    matched: number;
    imported: number;
    ignored: number;
    total: number;
}

export interface BankLinesResponse {
    lines: BankStatementLine[];
    summary: BankLinesSummary;
}

export interface BankLinesQuery {
    accountId?: string;
    status?: BankLineStatus;
    limit?: number;
}

export interface ImportBankLineInput {
    date: string;
    description: string;
    amount: number;
    type: "INCOME" | "EXPENSE";
    reference?: string;
}

export interface ImportBankLinesInput {
    accountId: string;
    lines: ImportBankLineInput[];
}

export interface ImportBankLinesResult {
    imported: number;
    duplicates: number;
    batchId: string;
}

export interface CreateFromBankLineInput {
    categoryId: string;
    name?: string;
    date?: string;
}
