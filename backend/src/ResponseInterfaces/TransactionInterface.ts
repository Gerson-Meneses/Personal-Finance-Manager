import { TypeTransaction } from "../utils/Enums";
import { AccountResponse } from "./AccountResponse";
import { CategoryResponse } from "./CategoryResponse";
import { LoanPaymentResponse, LoanResponse } from "./LoansResponse";

export interface TransactionResponse {
    id: string;
    name: string;
    type: TypeTransaction;
    amount: number;
    date: string;
    time?: string;
    postedAt?: Date; 
    description?: string;
    isRecurrent: boolean;
    account?: AccountResponse;
    relatedAccount?: AccountResponse;
    category?: CategoryResponse
    loan?: LoanResponse
    loanPayment?: LoanPaymentResponse
}