export interface ProductPriceResponse {
    transactionId: string;
    date: string;
    unitPrice: number;
    quantity: number;
    total: number;
    description?: string;
    merchantName?: string;
    merchantAddress?: string;
}

export interface ProductSummaryResponse {
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

export interface ProductDetailResponse extends ProductSummaryResponse {
    prices: ProductPriceResponse[];
}
