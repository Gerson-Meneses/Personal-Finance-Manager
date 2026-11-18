import type { Account } from "../accounts/types";

export type CreditChargeType = "INSURANCE" | "INTEREST" | "FEE" | "OTHER";
export type CreditChargeSource = "AUTO" | "MANUAL";
export type CreditInstallmentStatus = "PENDING" | "PAID" | "OVERDUE" | "CANCELLED";
export type CreditPlanStatus = "ACTIVE" | "COMPLETED" | "CANCELLED";
export type CreditDocumentType = "CONTRACT" | "STATEMENT" | "OTHER";
export type CreditCycleStatus = "OPEN" | "CLOSED" | "PAID" | "OVERDUE";

export interface CreditCardPending {
    id: string;
    name: string;
    amount: number;
    authorizedAmount?: number;
    date: string;
    time?: string;
    merchantName?: string;
    expectedPostAt?: string;
    ready: boolean;
    createdAt: string;
}

export interface CreditCardCharge {
    id: string;
    type: CreditChargeType;
    source: CreditChargeSource;
    rate?: number;
    baseAmount?: number;
    amount: number;
    periodKey?: string;
    closingDate: string;
    dueDate: string;
    installmentId?: string;
    description?: string;
    ignored: boolean;
    recurring: boolean;
    fixed: boolean;
}

export interface CreditCardInstallment {
    id: string;
    number: number;
    closingDate: string;
    dueDate: string;
    principal: number;
    interest: number;
    total: number;
    status: CreditInstallmentStatus;
    paidAmount: number;
}

export interface CreditCardPlanPreviewInstallment {
    number: number;
    dueDate: string;
    principal: number;
    interest: number;
    total: number;
}

export interface CreditCardPlanPreview {
    principal: number;
    installmentsCount: number;
    tea: number;
    totalInterest: number;
    totalAmount: number;
    firstDueDate: string;
    transactions: Array<{ id: string; name: string; date: string; amount: number }>;
    installments: CreditCardPlanPreviewInstallment[];
}

export interface CreditCardPlan {
    id: string;
    tea: number;
    principal: number;
    installmentsCount: number;
    firstDueDate: string;
    totalInterest: number;
    totalAmount: number;
    status: CreditPlanStatus;
    installments: CreditCardInstallment[];
}

export interface CreditCardCycle {
    closingDate: string;
    dueDate: string;
    periodKey: string;
    purchases: number;
    installmentsPrincipal: number;
    charges: number;
    total: number;
    paid: number;
    remaining: number;
    status: CreditCycleStatus;
}

export interface CreditCardEligiblePurchase {
    id: string;
    name: string;
    date: string;
    amount: number;
    merchantName?: string;
}

export interface MerchantAdjustment {
    merchantName: string;
    count: number;
    averageDelta: number;
    averagePercent: number;
    lastDelta: number;
    lastAmount: number;
}

export interface CreditCardSummary {
    account: Account;
    totalDebt: number;
    billedDebt: number;
    unbilledDebt: number;
    overdueDebt: number;
    availableCredit: number;
    maxCredit: number;
    usagePercent: number;
    currentStatement?: CreditCardCycle;
    nextStatement?: CreditCardCycle;
    nextDueDate?: string;
    nextDueAmount: number;
    pendingCount: number;
    pendingReadyCount: number;
    pendingAmount: number;
    pending: CreditCardPending[];
    cycles: CreditCardCycle[];
    plans: CreditCardPlan[];
    charges: CreditCardCharge[];
    eligiblePurchases: CreditCardEligiblePurchase[];
    merchantAdjustments: MerchantAdjustment[];
    insuranceEstimate: number;
    cycleExpenses: number;
}

export interface CreditCardDocument {
    id: string;
    fileName: string;
    mimeType: string;
    size: number;
    type: CreditDocumentType;
    extractedData?: Record<string, unknown> | null;
    createdAt: string;
}

export interface CreateInstallmentPlanInput {
    transactionIds: string[];
    installments: number;
    tea?: number;
}

export interface CreateChargeInput {
    type: CreditChargeType;
    amount: number;
    rate?: number;
    baseAmount?: number;
    dueDate?: string;
    description?: string;
}

export interface UpdateChargeInput {
    amount?: number;
    rate?: number;
    baseAmount?: number;
    dueDate?: string;
    description?: string;
}
