export interface Transaction {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE" | "CREDIT_PAYMENT " | "TRANSFER";
  amount: number;
  accountId: string;
  categoryId: string;
  date: string;
}

export interface TransactionQuerySchema {
  type?: "INCOME" | "EXPENSE" | "CREDIT_PAYMENT" | "TRANSFER"
  accountId?: string
  categoryId?: string
  date?: string
  from?: string
  to?: string
  amount?: number
  minAmount?: number
  maxAmount?: number
  relatedAccountId?: string
  page?: number,
  limit?: number,
  order?: "ASC" | "DESC"
}


