import type { Account } from "../accounts/types";
import type { Category, TransactionTypeBase } from "../categories/types";
import type { Loan, LoanPayment } from "../loans/types";

export type TransactionType = "INCOME" | "EXPENSE" | "CREDIT_PAYMENT" | "TRANSFER";

export interface Transaction {
  id: string;
  name: string;
  type: TransactionType;
  amount: number;
  date: string; // ISO String (YYYY-MM-DD)
  time?: string;
  description?: string;
  account: Account,
  relatedAccount: Account,
  category: Category,
  loan?: Loan,
  loanPayment?: LoanPayment
}

// Lo que envías al POST /transaction
export interface CreateTransactionDTO {
  name: string;
  type: TransactionTypeBase;
  amount: number; 
  accountId: string;
  categoryId: string;
  date: string;
  time?: string;
  description?: string;
  isRecurrent?: boolean;
}

export interface UpdateTransactionDTO {
  transactionId: string;
  name?: string;
  type?: TransactionTypeBase;
  amount?: number; 
  accountId?: string;
  categoryId?: string;
  date?: string;
  time?: string;
  description?: string;
  isRecurrent?: boolean;
}

export interface TransactionQuerySchema {
  type?: TransactionType;
  accountId?: string;
  categoryId?: string;
  date?: string;
  from?: string;
  to?: string;
  amount?: number;
  minAmount?: number;
  maxAmount?: number;
  relatedAccountId?: string;
  page?: number;
  limit?: number;
  order?: "ASC" | "DESC";
  search?: string
}