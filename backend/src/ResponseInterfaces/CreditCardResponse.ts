import type { AccountResponse } from "./AccountResponse";
import type { CreditChargeSource, CreditChargeType, CreditDocumentType, CreditInstallmentStatus, CreditTransactionStatus } from "../utils/Enums";

export interface CreditCardPendingResponse {
    id: string;
    name: string;
    amount: number;
    authorizedAmount?: number;
    date: string;
    time?: string;
    merchantName?: string;
    expectedPostAt?: Date;
    ready: boolean;
    createdAt: Date;
}

export interface CreditCardChargeResponse {
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

export interface CreditCardInstallmentResponse {
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

export interface CreditCardPlanPreviewResponse {
    principal: number;
    installmentsCount: number;
    tea: number;
    totalInterest: number;
    totalAmount: number;
    firstDueDate: string;
    transactions: Array<{ id: string; name: string; date: string; amount: number }>;
    installments: CreditCardPlanPreviewInstallment[];
}

export interface CreditCardPlanResponse {
    id: string;
    tea: number;
    principal: number;
    installmentsCount: number;
    firstDueDate: string;
    totalInterest: number;
    totalAmount: number;
    status: string;
    installments: CreditCardInstallmentResponse[];
}

export interface CreditCardCycleResponse {
    closingDate: string;
    dueDate: string;
    periodKey: string;
    purchases: number;
    installmentsPrincipal: number;
    charges: number;
    total: number;
    paid: number;
    remaining: number;
    status: "OPEN" | "CLOSED" | "PAID" | "OVERDUE";
}

export interface MerchantAdjustmentResponse {
    merchantName: string;
    count: number;
    averageDelta: number;
    averagePercent: number;
    lastDelta: number;
    lastAmount: number;
}

export interface CreditCardForecastItemResponse {
    id: string;
    accountId: string;
    accountName: string;
    title: string;
    subtitle: string;
    amount: number;
    dueDate: string;
    type: "EXPENSE";
    source: "INSURANCE" | "INSTALLMENT" | "CHARGE";
    recurring: boolean;
    fixed: boolean;
    estimated: boolean;
}

export interface CreditCardEligiblePurchaseResponse {
    id: string;
    name: string;
    date: string;
    amount: number;
    merchantName?: string;
}

export interface CreditCardSummaryResponse {
    account: AccountResponse;
    totalDebt: number;
    billedDebt: number;
    unbilledDebt: number;
    overdueDebt: number;
    availableCredit: number;
    maxCredit: number;
    usagePercent: number;
    currentStatement?: CreditCardCycleResponse;
    nextStatement?: CreditCardCycleResponse;
    nextDueDate?: string;
    nextDueAmount: number;
    pendingCount: number;
    pendingReadyCount: number;
    pendingAmount: number;
    pending: CreditCardPendingResponse[];
    cycles: CreditCardCycleResponse[];
    plans: CreditCardPlanResponse[];
    charges: CreditCardChargeResponse[];
    eligiblePurchases: CreditCardEligiblePurchaseResponse[];
    merchantAdjustments: MerchantAdjustmentResponse[];
    insuranceEstimate: number;
    cycleExpenses: number;
}

export interface CreditCardDocumentResponse {
    id: string;
    fileName: string;
    mimeType: string;
    size: number;
    type: CreditDocumentType;
    extractedData?: Record<string, unknown> | null;
    createdAt: Date;
}

export interface CreditCardTransactionStatusResponse {
    id: string;
    creditStatus: CreditTransactionStatus;
    amount: number;
    authorizedAmount?: number;
    postedAt?: string | null;
    confirmedAt?: Date | null;
}
