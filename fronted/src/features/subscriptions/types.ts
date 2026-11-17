import type { RecurrenceFrequency } from "../recurring/types";

export interface SubscriptionAccountInfo {
    id: string;
    name: string;
    color?: string;
    icon?: string;
}

export interface SubscriptionCategoryInfo {
    id: string;
    name: string;
    color?: string;
    icon?: string;
}

export interface SubscriptionItem {
    id: string;
    name: string;
    description?: string | null;
    amount: number;
    frequency: RecurrenceFrequency;
    intervalCount: number;
    monthlyEquivalent: number;
    yearlyEquivalent: number;
    nextDueDate: string | null;
    isActive: boolean;
    autoDebit: boolean;
    lastAmount?: number | null;
    previousAmount?: number | null;
    priceChange?: number | null;
    account?: SubscriptionAccountInfo;
    category?: SubscriptionCategoryInfo;
}

export interface SubscriptionSummary {
    monthlyTotal: number;
    yearlyTotal: number;
    activeCount: number;
    pausedCount: number;
    nextCharge: {
        id: string;
        name: string;
        amount: number;
        date: string;
    } | null;
}

export interface SubscriptionHubResponse {
    generatedAt: string;
    summary: SubscriptionSummary;
    subscriptions: SubscriptionItem[];
}
