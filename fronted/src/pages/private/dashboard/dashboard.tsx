import { useState } from "react";
import { Plus } from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/es";
import { useAuthContext } from "../../../features/auth/authContext";
import { useDashboard } from "../../../features/dashboard/hooks";
import { useTransactions } from "../../../features/transactions/hooks";
import BalanceHero from "../../../features/dashboard/components/balanceCard/balanceCard";
import AccountsList from "../../../features/dashboard/components/accountList";
import RecentTransactions from "../../../features/dashboard/components/recentTransactions";
import ExpensesByCategory from "../../../features/dashboard/components/expensesByCategory";
import QuickStats from "../../../features/dashboard/components/quickStats";
import LoanStats from "../../../features/dashboard/components/LoanStats/LoanStats";
import LoadingScreen from "../../../shared/components/LoadingScreen/LoadingScreen";
import ModalPortal from "../../../shared/components/ModalPortal/ModalPortal";
import TransactionForm from "../../../features/transactions/components/TransactionForm/TransactionForm";
import { AddAnotherTransactionPrompt } from "../../../features/transactions/components/AddAnotherTransactionPrompt";
import "./dashboard.css";

dayjs.locale("es");

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function DashboardPage() {
    const { user } = useAuthContext();
    const { dashboardData, loading, error, refresh } = useDashboard();
    const { saveTransaction } = useTransactions();
    const [txModal, setTxModal] = useState(false);
    const [askAnother, setAskAnother] = useState(false);

    if (loading) return <LoadingScreen />;

    if (error || !dashboardData) {
        return (
            <div className="dashboard">
                <div className="card dashboard-error">
                    <p>Hubo un problema al cargar los datos.</p>
                    <p className="text-muted">{error?.message || "Error inesperado"}</p>
                    <button className="btn-primary" onClick={() => refresh()}>
                        Reintentar
                    </button>
                </div>
            </div>
        );
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

    const firstName = user?.name?.split(" ")[0];
    const today = capitalize(dayjs().format("dddd, D [de] MMMM [de] YYYY"));

    return (
        <div className="dashboard">
            {/* Cabecera: saludo + fecha + CTA */}
            <header className="dash-header">
                <div>
                    <h1>Hola, {firstName ?? "de nuevo"}</h1>
                    <p className="text-muted">{today}</p>
                </div>
                <button
                    className="btn-primary"
                    onClick={() => {
                        saveTransaction.reset();
                        setTxModal(true);
                    }}
                >
                    <Plus size={18} />
                    Nueva transacción
                </button>
            </header>

            {/* Fila 1: patrimonio + resumen del mes */}
            <section className="grid-auto-tall">
                <BalanceHero balances={balances} credit={credit} />
                <QuickStats
                    income={month.income}
                    expense={month.expense}
                    net={month.net}
                    topCategory={topCategory}
                    totalAmtDue={loans.totalAmtDue}
                    totalDebt={loans.totalDebt}
                />
            </section>

            {/* Fila 2: cuentas + préstamos / categorías / actividad */}
            <section className="grid-auto-tall">
                <AccountsList accounts={accounts} />
                <div className="dash-side">
                    <LoanStats loans={loans} />
                    <ExpensesByCategory
                        expenses={expensesByCategory}
                        totalExpense={month.expense}
                    />
                    <RecentTransactions
                        transactions={recentActivity.transactions}
                    />
                </div>
            </section>

            {/* ── Modal: nueva transacción ───────────────────────────── */}
            <ModalPortal isOpen={txModal} onClose={() => setTxModal(false)}>
                <TransactionForm
                    mutation={saveTransaction}
                    onClose={() => setTxModal(false)}
                    onSuccess={() => {
                        setTxModal(false);
                        setAskAnother(true);
                    }}
                />
            </ModalPortal>
            <AddAnotherTransactionPrompt
                isOpen={askAnother}
                onClose={() => setAskAnother(false)}
                onAddAnother={() => {
                    setAskAnother(false);
                    saveTransaction.reset();
                    setTxModal(true);
                }}
            />
        </div>
    )
}
