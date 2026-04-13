import { useDashboard } from "../../../features/dashboard/hooks"
import BalanceCards from "../../../features/dashboard/components/balanceCard"
import AccountsList from "../../../features/dashboard/components/accountList"
import LoansSummary from "../../../features/dashboard/components/loanSummary"
import RecentTransactions from "../../../features/dashboard/components/recentTransactions"
import ExpensesByCategory from "../../../features/dashboard/components/expensesByCategory"
import QuickStats from "../../../features/dashboard/components/quickStats"
import LoadingScreen from "../../../shared/components/LoadingScreen/LoadingScreen"
import "./dashboard.css"

export default function DashboardPage() {
    const { dashboardData, loading, error } = useDashboard()

    if (loading) return <LoadingScreen />

    if (error || !dashboardData) {
        return (
            <div className="dashboard-error">
                Hubo un problema al cargar los datos.
            </div>
        )
    }

    const {
        balances,
        credit,
        month,
        accounts,
        loans,
        recentActivity,
        expensesByCategory
    } = dashboardData

    const topCategory = expensesByCategory.length > 0
        ? [...expensesByCategory].sort((a, b) => b.amount - a.amount)[0]
        : undefined

    return (
        <div className="dashboard">

            {/* Fila 1: balance cards */}
            <section className="dashboard-balances">
                <BalanceCards balances={balances} credit={credit} />
            </section>

            {/* Fila 2: quick stats del mes */}
            <section className="dashboard-month">
                <QuickStats
                    income={month.income}
                    expense={month.expense}
                    net={month.net}
                    topCategory={topCategory}
                    totalAmtDue={loans.totalAmtDue}
                    totalDebt={loans.totalDebt}
                />
            </section>

            {/* Fila 3: cuentas + préstamos */}
            <section className="dashboard-mid-grid">
                <AccountsList accounts={accounts} />
                <LoansSummary loans={loans} />
            </section>

            {/* Fila 4: gastos por categoría + actividad reciente */}
            <section className="dashboard-bottom-grid">
                <ExpensesByCategory
                    expenses={expensesByCategory}
                    totalExpense={month.expense}
                />
                <RecentTransactions
                    transactions={recentActivity.transactions}
                />
            </section>

        </div>
    )
}