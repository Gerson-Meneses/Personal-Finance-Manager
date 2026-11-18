import { useState } from "react";
import { ChartNoAxesCombined, Plus, Settings2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import "dayjs/locale/es";
import { useAuthContext } from "../../../features/auth/useAuthContext";
import { useDashboard } from "../../../features/dashboard/hooks";
import { useTransactions } from "../../../features/transactions/hooks";
import { useDashboardPreferences } from "../../../features/dashboard/useDashboardPreferences";
import type { DashboardWidgetId } from "../../../features/dashboard/preferences";
import { DashboardSettings } from "../../../features/dashboard/components/DashboardSettings";
import BalanceHero from "../../../features/dashboard/components/balanceCard/balanceCard";
import AccountsList from "../../../features/dashboard/components/accountList";
import RecentTransactions from "../../../features/dashboard/components/recentTransactions";
import ExpensesByCategory from "../../../features/dashboard/components/expensesByCategory";
import QuickStats from "../../../features/dashboard/components/quickStats";
import LoanStats from "../../../features/dashboard/components/LoanStats/LoanStats";
import { RecurringForecastCard } from "../../../features/recurring/components/RecurringForecastCard";
import LoadingScreen from "../../../shared/components/LoadingScreen/LoadingScreen";
import ModalPortal from "../../../shared/components/ModalPortal/ModalPortal";
import TransactionForm from "../../../features/transactions/components/TransactionForm/TransactionForm";
import { AddAnotherTransactionPrompt } from "../../../features/transactions/components/AddAnotherTransactionPrompt";
import "./dashboard.css";

dayjs.locale("es");

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function DashboardPage() {
    const { user } = useAuthContext();
    const navigate = useNavigate();
    const { dashboardData, loading, error, refresh } = useDashboard();
    const { saveTransaction } = useTransactions();
    const { preferences, updatePreferences, resetPreferences } =
        useDashboardPreferences(user?.id);
    const [txModal, setTxModal] = useState(false);
    const [askAnother, setAskAnother] = useState(false);
    const [customizeOpen, setCustomizeOpen] = useState(false);

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

    const widgetView = (id: DashboardWidgetId) =>
        preferences.widgets[id]?.view ?? "full";

    const renderWidget = (id: DashboardWidgetId) => {
        switch (id) {
            case "forecast":
                return <RecurringForecastCard view={widgetView(id)} />;
            case "balance":
                return (
                    <BalanceHero
                        balances={balances}
                        credit={credit}
                        view={widgetView(id)}
                    />
                );
            case "quickStats":
                return (
                    <QuickStats
                        income={month.income}
                        expense={month.expense}
                        net={month.net}
                        topCategory={topCategory}
                        totalAmtDue={loans.totalAmtDue}
                        totalDebt={loans.totalDebt}
                        view={widgetView(id)}
                    />
                );
            case "accounts":
                return (
                    <AccountsList
                        accounts={accounts}
                        view={widgetView(id)}
                    />
                );
            case "loans":
                return <LoanStats loans={loans} view={widgetView(id)} />;
            case "expenses":
                return (
                    <ExpensesByCategory
                        expenses={expensesByCategory}
                        totalExpense={month.expense}
                        view={widgetView(id)}
                    />
                );
            case "recent":
                return (
                    <RecentTransactions
                        transactions={recentActivity.transactions}
                        view={widgetView(id)}
                    />
                );
            default:
                return null;
        }
    };

    const visibleWidgets = preferences.order.filter(
        (id) => id === "forecast" || preferences.widgets[id]?.visible
    );

    return (
        <div className="dashboard">
            {/* Cabecera: saludo + fecha + CTA */}
            <header className="dash-header">
                <div>
                    <h1>Hola, {firstName ?? "de nuevo"}</h1>
                    <p className="text-muted">{today}</p>
                </div>
                <div className="dash-header__actions">
                    <button
                        className="btn-secondary"
                        onClick={() => setCustomizeOpen(true)}
                    >
                        <Settings2 size={17} />
                        Personalizar
                    </button>
                    <button
                        className="btn-secondary"
                        onClick={() => navigate("/reports")}
                    >
                        <ChartNoAxesCombined size={17} />
                        Ver reportes
                    </button>
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
                </div>
            </header>

            <div
                className={`dashboard-widgets dashboard-layout--${preferences.layout} dashboard-density--${preferences.density}`}
            >
                {visibleWidgets.map((id) => (
                    <section
                        key={id}
                        className={`dash-widget dash-widget--${id} dash-widget--view-${widgetView(id)}`}
                    >
                        {renderWidget(id)}
                    </section>
                ))}
            </div>

            <ModalPortal
                isOpen={customizeOpen}
                onClose={() => setCustomizeOpen(false)}
                contentClassName="modal-content--wide"
            >
                <div className="card dashboard-settings-modal">
                    <DashboardSettings
                        preferences={preferences}
                        onChange={updatePreferences}
                        onReset={resetPreferences}
                        onClose={() => setCustomizeOpen(false)}
                    />
                </div>
            </ModalPortal>

            {/* Modal: nueva transacción */}
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
