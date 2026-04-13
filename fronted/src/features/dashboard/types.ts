import type { Account } from "../accounts/types"
import type { Transaction } from "../transactions/types"

export interface Loan {
  id: string
  type: "GIVEN" | "RECEIVED"
  lender: string
  principalAmount: number
  status: string
  startDate: string
}
export interface Loan {

}

export interface DashboardResponse {

  balances: {
    debit: number
    credit: number
  }

  credit: {
    debt: number
  }

  loans: {
    totalDebt: number
    totalAmtDue: number
    given: Loan[]
    received: Loan[]
  }

  month: {
    income: number
    expense: number
    net: number
  }

  expensesByCategory: CategoryExpense[]

  accounts: Account[]

  recentActivity: {
    transactions: Transaction[]
  }

}

export interface CategoryExpense {
  category: {
    id: string
    name: string
    color: string
    icon: string
  }
  amount: number   
  total: number    
}
