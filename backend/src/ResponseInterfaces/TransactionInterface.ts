import { TypeTransaction } from "../utils/Enums";
import { AccountResponse } from "./AccountResponse";
import { CategoryResponse } from "./CategoryResponse";
import { LoanPaymentResponse, LoanResponse } from "./LoansResponse";
import { TagResponse } from "./TagResponse";

export interface TransactionSplitResponse {
    id: string;
    amount: number;
    description?: string;
    category?: CategoryResponse;
    tags?: TagResponse[];
}

export interface TransactionAttachmentResponse {
    id: string;
    fileName: string;
    mimeType: string;
    size: number;
    createdAt?: Date;
}

export interface TransactionItemResponse {
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
}

export interface TransactionResponse {
    id: string;
    name: string;
    type: TypeTransaction;
    amount: number;
    date: string;
    time?: string;
    postedAt?: Date; 
    description?: string;
    merchantName?: string;
    merchantAddress?: string;
    merchantRuc?: string;
    isRecurrent: boolean;
    account?: AccountResponse;
    relatedAccount?: AccountResponse;
    category?: CategoryResponse
    loan?: LoanResponse
    tags?: TagResponse[];
    splits?: TransactionSplitResponse[];
    items?: TransactionItemResponse[];
    attachments?: TransactionAttachmentResponse[];
}

export interface TransactionStatsResponse {
    count: number;
    income: number;
    expense: number;
    net: number;
    transfers: number;
    creditPayments: number;
}