export interface BudgetCategory {
    id: string;
    name: string;
    color: string;
    icon?: string | null;
}

export interface BudgetItem {
    id: string;
    category: BudgetCategory;
    month: string;
    amount: number;
    spent: number;
    remaining: number;
    percentage: number;
    overBudget: boolean;
}

export interface BudgetMonth {
    month: string;
    totalBudget: number;
    totalSpent: number;
    totalRemaining: number;
    budgets: BudgetItem[];
}

export interface BudgetSuggestion {
    category: BudgetCategory;
    suggested: number;
    average: number;
    monthsWithData: number;
    currentBudget: number | null;
    source: "HISTORY" | "INCOME" | "STARTER";
}

export interface BudgetSuggestionResponse {
    month: string;
    lookbackMonths: number;
    monthlyIncome: number;
    suggestions: BudgetSuggestion[];
}
