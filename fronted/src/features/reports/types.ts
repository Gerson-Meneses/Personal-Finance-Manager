export interface ReportRange {
    from: string;
    to: string;
    months: number;
}

export interface ReportMonth {
    month: string;
    income: number;
    expense: number;
    net: number;
    savingsRate: number;
    count: number;
    budget: number;
    budgetUsage: number | null;
}

export interface ReportCategory {
    id: string | null;
    name: string;
    color: string;
    icon: string | null;
    total: number;
    count: number;
    /** Montos alineados con `months` (mismo orden y longitud). */
    monthly: number[];
}

export interface ReportTopExpense {
    name: string;
    total: number;
    count: number;
}

export interface ReportTotals {
    income: number;
    expense: number;
    net: number;
    savingsRate: number;
    transactionCount: number;
    avgIncome: number;
    avgExpense: number;
    avgNet: number;
    totalBudget: number;
    budgetUsage: number | null;
}

export interface ReportHighlights {
    bestMonth: ReportMonth | null;
    worstMonth: ReportMonth | null;
    highestExpenseMonth: ReportMonth | null;
    highestIncomeMonth: ReportMonth | null;
}

export interface MonthlyReportResponse {
    range: ReportRange;
    totals: ReportTotals;
    months: ReportMonth[];
    expenseCategories: ReportCategory[];
    incomeCategories: ReportCategory[];
    topExpenses: ReportTopExpense[];
    highlights: ReportHighlights;
}
