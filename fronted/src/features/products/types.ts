export interface ProductSummary {
    normalizedName: string;
    name: string;
    bestPrice: number;
    averagePrice: number;
    lastPrice: number;
    purchaseCount: number;
    lastDate: string | null;
    bestMerchantName?: string;
    bestMerchantAddress?: string;
    bestDate?: string;
    bestTransactionId?: string;
}

export interface ProductPrice {
    transactionId: string;
    date: string;
    unitPrice: number;
    quantity: number;
    total: number;
    merchantName?: string;
    merchantAddress?: string;
}

export interface ProductDetail extends ProductSummary {
    prices: ProductPrice[];
}

export type ProductOrder = "name" | "price" | "recent" | "purchases";

export interface ProductQuery {
    search?: string;
    page?: number;
    limit?: number;
    order?: ProductOrder;
}
