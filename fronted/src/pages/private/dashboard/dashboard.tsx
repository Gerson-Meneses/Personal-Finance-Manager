import { useDashboard } from "../../../features/dashboard/hooks"
import BalanceCards from "../../../features/dashboard/components/balanceCard/balanceCard"
import AccountsList from "../../../features/dashboard/components/accountList"
import RecentTransactions from "../../../features/dashboard/components/recentTransactions"
import ExpensesByCategory from "../../../features/dashboard/components/expensesByCategory"
import QuickStats from "../../../features/dashboard/components/quickStats"
import LoadingScreen from "../../../shared/components/LoadingScreen/LoadingScreen"
import "./dashboard.css"
import LoanStats from "../../../features/dashboard/components/LoanStats/LoanStats"

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
            <div className="bg-red-500 text-white p-10">
                SI VES ROJO, TAILWIND FUNCIONA
            </div>
            {/* Fila 1: balance cards y Quick Stats */}
            <section className="grid-auto-tall">
                <BalanceCards balances={balances} credit={credit} />
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
            <section className="grid-auto-tall">
                <AccountsList accounts={accounts} />
                <section style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    <LoanStats loans={loans} />
                    <ExpensesByCategory
                        expenses={expensesByCategory}
                        totalExpense={month.expense}
                    /><RecentTransactions
                        transactions={recentActivity.transactions}
                    />
                </section>

            </section>
        </div>
    )
}