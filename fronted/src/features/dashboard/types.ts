export interface Loan {
  id: string
  type: "GIVEN" | "RECEIVED"
  lender: string
  principalAmount: number
  status: string
  startDate: string
}

export interface Account {
  id: string
  name: string
  type: string
  balance: number
  color: string
}

export interface Loan {
  
}

export interface Category {
  id: string
  name: string
  type: string
  color: string
  icon: string
}

export interface Transaction {
  id: string
  name: string
  type: "EXPENSE" | "INCOME"
  amount: number
  date: string
  category: Category
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

  expensesByCategory: {
    category: string
    total: number
  }[]

  accounts: Account[]

  recentActivity: {
    transactions: Transaction[]
  }

}