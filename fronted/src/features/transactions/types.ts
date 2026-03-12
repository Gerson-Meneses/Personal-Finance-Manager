export interface Transaction {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE" | "CREDIT_PAYMENT " | "TRANSFER";
  amount: number;
  accountId: string;
  categoryId: string;
  date: string;
}


