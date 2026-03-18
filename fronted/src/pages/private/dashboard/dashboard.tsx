import { useDashboard } from "../../../features/dashboard/hooks"
import BalanceCards from "../../../features/dashboard/components/balanceCard"
import MonthSummary from "../../../features/dashboard/components/monthSummary"
import AccountsList from "../../../features/dashboard/components/accountList"
import LoansSummary from "../../../features/dashboard/components/loanSummary"
import RecentTransactions from "../../../features/dashboard/components/recentTransactions"
import "./dashboard.css"

export default function DashboardPage() {
  const { dashboardData, loading, error } = useDashboard()

  if (loading) return <div className="loading-container">Cargando tu resumen...</div>
  
  if (error || !dashboardData) {
    return <div className="error-container">Hubo un problema al cargar los datos.</div>
  }

  const { balances, credit, month, accounts, loans, recentActivity } = dashboardData

  return (
    <main className="dashboard">
      <section className="dashboard-header">
        <BalanceCards balances={balances} credit={credit} />
        <MonthSummary month={month} />
      </section>

      <div className="dashboard-grid">
        <AccountsList accounts={accounts} />
        <LoansSummary loans={loans} />
      </div>

      <section className="dashboard-activity">
        <RecentTransactions transactions={recentActivity.transactions} />
      </section>
    </main>
  )
}