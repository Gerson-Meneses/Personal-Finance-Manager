import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import dayjs from "dayjs";
import "dayjs/locale/es";
import {
    AlertTriangle,
    ArrowRight,
    CalendarClock,
    PiggyBank,
    RefreshCw,
    Repeat,
    Wallet,
} from "lucide-react";
import LoadingScreen from "../../../shared/components/LoadingScreen/LoadingScreen";
import { getIcon } from "../../../shared/utils/GetIcon";
import { formatCurrency } from "../../../shared/utils/formatCurrency";
import { useBudgets } from "../../../features/budgets/hooks";
import { useRecurringProjection } from "../../../features/recurring/hooks";
import { useSubscriptionHub } from "../../../features/subscriptions/hooks";
import RecurringPaymentsPage from "../recurring/RecurringPaymentsPage";
import SubscriptionsPage from "../subscriptions/SubscriptionsPage";
import BudgetsPage from "../budgets/BudgetsPage";
import type { RecurringOccurrence } from "../../../features/recurring/types";
import "./PlanningPage.css";

dayjs.locale("es");

type PlanningTab = "overview" | "recurring" | "subscriptions" | "budgets";

const TABS: {
    value: PlanningTab;
    label: string;
    icon: typeof CalendarClock;
}[] = [
    { value: "overview", label: "Resumen", icon: Wallet },
    { value: "recurring", label: "Previstos", icon: CalendarClock },
    { value: "subscriptions", label: "Suscripciones", icon: Repeat },
    { value: "budgets", label: "Presupuestos", icon: PiggyBank },
];

const isPendingOccurrence = (occurrence: RecurringOccurrence) =>
    occurrence.status === "PENDING" || occurrence.status === "DUE";

interface CorrelationRow {
    categoryId: string;
    name: string;
    color: string;
    budget: number | null;
    spent: number;
    pending: number;
    subscription: number;
    available: number | null;
}

export default function PlanningPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const rawTab = searchParams.get("tab");
    const tab: PlanningTab = TABS.some((item) => item.value === rawTab)
        ? (rawTab as PlanningTab)
        : "overview";

    const currentMonth = dayjs().format("YYYY-MM");
    const projection = useRecurringProjection(currentMonth);
    const subscriptions = useSubscriptionHub();
    const budgets = useBudgets(currentMonth);

    const changeTab = (next: PlanningTab) => {
        setSearchParams({ tab: next });
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const refreshAll = async () => {
        await Promise.all([
            projection.refetch(),
            subscriptions.refetch(),
            budgets.refetch(),
        ]);
    };

    const overview = useMemo(() => {
        const projectionData = projection.projection;
        const subscriptionHub = subscriptions.hub;
        const budgetData = budgets.data;

        const occurrences = (projectionData?.occurrences ?? []).filter(isPendingOccurrence);
        const pendingExpenseOccurrences = occurrences.filter((item) => item.type === "EXPENSE");
        const pendingIncomeOccurrences = occurrences.filter((item) => item.type === "INCOME");
        const pendingExpense = pendingExpenseOccurrences.reduce((sum, item) => sum + item.amount, 0);
        const pendingIncome = pendingIncomeOccurrences.reduce((sum, item) => sum + item.amount, 0);

        const subscriptionIds = new Set(
            (subscriptionHub?.subscriptions ?? []).map((item) => item.id)
        );
        const projectedSubscriptionExpense = pendingExpenseOccurrences
            .filter((item) => subscriptionIds.has(item.paymentId))
            .reduce((sum, item) => sum + item.amount, 0);

        const pendingByCategory = new Map<string, number>();
        for (const occurrence of pendingExpenseOccurrences) {
            const categoryId = occurrence.category?.id;
            if (!categoryId) continue;
            pendingByCategory.set(categoryId, (pendingByCategory.get(categoryId) ?? 0) + occurrence.amount);
        }

        const subscriptionsByCategory = new Map<string, number>();
        for (const item of subscriptionHub?.subscriptions ?? []) {
            if (!item.isActive || !item.category?.id) continue;
            subscriptionsByCategory.set(
                item.category.id,
                (subscriptionsByCategory.get(item.category.id) ?? 0) + item.monthlyEquivalent
            );
        }

        const budgetsByCategory = new Map(
            (budgetData?.budgets ?? []).map((budget) => [budget.category.id, budget])
        );
        const categoryInfo = new Map<string, { name: string; color: string }>();
        for (const budget of budgetData?.budgets ?? []) {
            categoryInfo.set(budget.category.id, {
                name: budget.category.name,
                color: budget.category.color,
            });
        }
        for (const occurrence of pendingExpenseOccurrences) {
            if (occurrence.category?.id) {
                categoryInfo.set(occurrence.category.id, {
                    name: occurrence.category.name,
                    color: occurrence.category.color ?? "#64748b",
                });
            }
        }
        for (const item of subscriptionHub?.subscriptions ?? []) {
            if (item.category?.id) {
                categoryInfo.set(item.category.id, {
                    name: item.category.name,
                    color: item.category.color ?? "#64748b",
                });
            }
        }

        const categoryIds = new Set([
            ...budgetsByCategory.keys(),
            ...pendingByCategory.keys(),
            ...subscriptionsByCategory.keys(),
        ]);

        const rows: CorrelationRow[] = [...categoryIds]
            .map((categoryId) => {
                const budget = budgetsByCategory.get(categoryId);
                const pending = pendingByCategory.get(categoryId) ?? 0;
                const subscription = subscriptionsByCategory.get(categoryId) ?? 0;
                const budgetAmount = budget?.amount ?? null;
                const spent = budget?.spent ?? 0;
                const info = categoryInfo.get(categoryId);

                return {
                    categoryId,
                    name: info?.name ?? "Sin categoría",
                    color: info?.color ?? "#64748b",
                    budget: budgetAmount,
                    spent,
                    pending,
                    subscription,
                    available:
                        budgetAmount === null
                            ? null
                            : Math.round((budgetAmount - spent - pending) * 100) / 100,
                };
            })
            .filter((row) => row.budget !== null || row.pending > 0 || row.subscription > 0)
            .sort((a, b) => {
                if (a.available !== null && b.available !== null && (a.available < 0) !== (b.available < 0)) {
                    return a.available < 0 ? -1 : 1;
                }
                return (b.budget ?? b.pending) - (a.budget ?? a.pending);
            })
            .slice(0, 10);

        const riskCount = rows.filter((row) => row.available !== null && row.available < 0).length;
        const budgetTotal = budgetData?.totalBudget ?? 0;
        const budgetSpent = budgetData?.totalSpent ?? 0;
        const budgetRemaining = budgetData?.totalRemaining ?? 0;
        const afterRecurring =
            budgetTotal > 0
                ? Math.round((budgetRemaining - pendingExpense) * 100) / 100
                : null;

        const upcoming = [...occurrences]
            .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
            .slice(0, 5);

        const nextCharges = [...(subscriptionHub?.subscriptions ?? [])]
            .filter((item) => item.isActive && item.nextDueDate)
            .sort((a, b) => (a.nextDueDate ?? "").localeCompare(b.nextDueDate ?? ""))
            .slice(0, 5);

        const topSubscriptions = [...(subscriptionHub?.subscriptions ?? [])]
            .filter((item) => item.isActive)
            .sort((a, b) => b.monthlyEquivalent - a.monthlyEquivalent)
            .slice(0, 5);

        return {
            pendingExpense,
            pendingIncome,
            projectedSubscriptionExpense,
            budgetTotal,
            budgetSpent,
            budgetRemaining,
            afterRecurring,
            riskCount,
            rows,
            upcoming,
            nextCharges,
            topSubscriptions,
        };
    }, [projection.projection, subscriptions.hub, budgets.data]);

    const loading =
        (projection.loading && !projection.projection) ||
        (subscriptions.loading && !subscriptions.hub) ||
        (budgets.loading && !budgets.data);

    if (loading) return <LoadingScreen message="Conectando previstos, suscripciones y presupuesto..." />;

    const budgetUsage = overview.budgetTotal > 0
        ? Math.round((overview.budgetSpent / overview.budgetTotal) * 100)
        : null;

    return (
        <div className="page-container planning-page">
            <header className="planning-header card">
                <div className="planning-header__text">
                    <span className="planning-header__eyebrow">Una sola vista</span>
                    <h1>Planificación</h1>
                    <p className="text-muted">
                        Previstos, suscripciones y presupuesto conectados para decidir antes de gastar.
                    </p>
                </div>
                <div className="planning-header__actions">
                    <button
                        type="button"
                        className="btn-secondary planning-refresh"
                        onClick={() => refreshAll()}
                    >
                        <RefreshCw size={15} />
                        Actualizar
                    </button>
                    <button
                        type="button"
                        className="btn-primary planning-open"
                        onClick={() => changeTab("recurring")}
                    >
                        Nuevo previsto
                        <ArrowRight size={15} />
                    </button>
                </div>
            </header>

            <nav className="planning-tabs card" role="tablist" aria-label="Secciones de planificación">
                {TABS.map(({ value, label, icon: Icon }) => (
                    <button
                        key={value}
                        type="button"
                        role="tab"
                        aria-selected={tab === value}
                        className={`planning-tab ${tab === value ? "is-active" : ""}`}
                        onClick={() => changeTab(value)}
                    >
                        <Icon size={16} />
                        {label}
                    </button>
                ))}
            </nav>

            {tab === "overview" ? (
                <div role="tabpanel" className="planning-overview">
                    <section className="planning-kpis">
                        <article className="planning-kpi card">
                            <span className="planning-kpi__icon is-budget"><PiggyBank size={17} /></span>
                            <div>
                                <span>Presupuesto del mes</span>
                                <strong className="amount-font">{formatCurrency(overview.budgetTotal)}</strong>
                                <small>
                                    {budgetUsage === null
                                        ? "Sin presupuesto configurado"
                                        : `${budgetUsage}% usado · ${formatCurrency(overview.budgetRemaining)} disponible`}
                                </small>
                            </div>
                        </article>

                        <article className="planning-kpi card">
                            <span className="planning-kpi__icon is-pending"><CalendarClock size={17} /></span>
                            <div>
                                <span>Por pagar previsto</span>
                                <strong className="amount-font text-danger">{formatCurrency(overview.pendingExpense)}</strong>
                                <small>
                                    {overview.pendingIncome > 0
                                        ? `Entradas previstas ${formatCurrency(overview.pendingIncome)}`
                                        : "Sin entradas previstas pendientes"}
                                </small>
                            </div>
                        </article>

                        <article className="planning-kpi card">
                            <span className="planning-kpi__icon is-subs"><Repeat size={17} /></span>
                            <div>
                                <span>Suscripciones activas</span>
                                <strong className="amount-font">{formatCurrency(subscriptions.hub?.summary.monthlyTotal ?? 0)}<small>/mes</small></strong>
                                <small>
                                    {subscriptions.hub?.summary.activeCount ?? 0} activas · {formatCurrency(overview.projectedSubscriptionExpense)} por cobrar este mes
                                </small>
                            </div>
                        </article>

                        <article className={`planning-kpi card ${overview.riskCount > 0 ? "is-risk" : ""}`}>
                            <span className="planning-kpi__icon is-risk"><AlertTriangle size={17} /></span>
                            <div>
                                <span>Después de previstos</span>
                                <strong
                                    className={`amount-font ${
                                        overview.afterRecurring === null
                                            ? ""
                                            : overview.afterRecurring < 0
                                                ? "text-danger"
                                                : "text-success"
                                    }`}
                                >
                                    {overview.afterRecurring === null
                                        ? "—"
                                        : formatCurrency(overview.afterRecurring)}
                                </strong>
                                <small>
                                    {overview.afterRecurring === null
                                        ? "Configura un presupuesto para calcularlo"
                                        : overview.riskCount > 0
                                            ? `${overview.riskCount} categoría${overview.riskCount === 1 ? "" : "s"} en riesgo`
                                            : "Sin categorías en riesgo"}
                                </small>
                            </div>
                        </article>
                    </section>

                    <div className="planning-main-grid">
                        <section className="card planning-panel planning-correlation">
                            <div className="planning-panel__head">
                                <div>
                                    <h2>Presupuesto, gasto y previstos</h2>
                                    <p className="text-muted">Así se relacionan tus tres planificaciones por categoría.</p>
                                </div>
                                <button type="button" className="btn-ghost" onClick={() => changeTab("budgets")}>
                                    Ver presupuestos <ArrowRight size={14} />
                                </button>
                            </div>

                            {overview.rows.length === 0 ? (
                                <div className="planning-empty">
                                    <p>Aún no hay presupuestos ni previstos para correlacionar.</p>
                                    <button type="button" className="btn-primary" onClick={() => changeTab("budgets")}>
                                        Configurar presupuesto
                                    </button>
                                </div>
                            ) : (
                                <div className="planning-table-wrap">
                                    <table className="planning-table">
                                        <thead>
                                            <tr>
                                                <th>Categoría</th>
                                                <th>Presupuesto</th>
                                                <th>Gastado</th>
                                                <th>Previsto pendiente</th>
                                                <th>Suscripciones</th>
                                                <th>Disponible</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {overview.rows.map((row) => (
                                                <tr key={row.categoryId} className={row.available !== null && row.available < 0 ? "is-risk" : ""}>
                                                    <td>
                                                        <span className="planning-category">
                                                            <span className="planning-category__dot" style={{ background: row.color }} />
                                                            {row.name}
                                                        </span>
                                                    </td>
                                                    <td>{row.budget === null ? "—" : formatCurrency(row.budget)}</td>
                                                    <td>{formatCurrency(row.spent)}</td>
                                                    <td className="text-warning">{formatCurrency(row.pending)}</td>
                                                    <td>{formatCurrency(row.subscription)}</td>
                                                    <td className={row.available !== null && row.available < 0 ? "text-danger" : "text-success"}>
                                                        {row.available === null ? "Sin presupuesto" : formatCurrency(row.available)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </section>

                        <aside className="planning-side">
                            <section className="card planning-panel">
                                <div className="planning-panel__head">
                                    <div>
                                        <h2>Próximos cobros</h2>
                                        <p className="text-muted">Suscripciones y previstos más cercanos.</p>
                                    </div>
                                </div>
                                {overview.nextCharges.length === 0 ? (
                                    <p className="planning-empty-text">Sin suscripciones activas.</p>
                                ) : (
                                    <ul className="planning-list">
                                        {overview.nextCharges.map((item) => (
                                            <li key={item.id}>
                                                <span className="planning-list__icon" style={{ color: item.category?.color }}>
                                                    {getIcon(item.category?.icon ?? "Repeat", { size: 16 })}
                                                </span>
                                                <div>
                                                    <strong>{item.name}</strong>
                                                    <small>{dayjs(item.nextDueDate).format("D MMM")} · {formatCurrency(item.amount)}</small>
                                                </div>
                                                <span className="planning-list__badge">{formatCurrency(item.monthlyEquivalent)}/mes</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                <button type="button" className="planning-link" onClick={() => changeTab("subscriptions")}>
                                    Ver hub de suscripciones <ArrowRight size={14} />
                                </button>
                            </section>

                            <section className="card planning-panel">
                                <div className="planning-panel__head">
                                    <div>
                                        <h2>Mayor impacto mensual</h2>
                                        <p className="text-muted">Suscripciones que más pesan en tu presupuesto.</p>
                                    </div>
                                </div>
                                {overview.topSubscriptions.length === 0 ? (
                                    <p className="planning-empty-text">Sin suscripciones activas.</p>
                                ) : (
                                    <ul className="planning-list">
                                        {overview.topSubscriptions.map((item) => (
                                            <li key={item.id}>
                                                <span className="planning-list__icon" style={{ color: item.category?.color }}>
                                                    {getIcon(item.category?.icon ?? "Repeat", { size: 16 })}
                                                </span>
                                                <div>
                                                    <strong>{item.name}</strong>
                                                    <small>{item.category?.name ?? "Sin categoría"}</small>
                                                </div>
                                                <span className="planning-list__badge is-amount">{formatCurrency(item.monthlyEquivalent)}/mes</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </section>
                        </aside>
                    </div>

                    <section className="card planning-upcoming">
                        <div className="planning-panel__head">
                            <div>
                                <h2>Movimientos previstos pendientes</h2>
                                <p className="text-muted">Lo que todavía falta confirmar este mes.</p>
                            </div>
                            <button type="button" className="btn-ghost" onClick={() => changeTab("recurring")}>
                                Abrir previstos <ArrowRight size={14} />
                            </button>
                        </div>
                        {overview.upcoming.length === 0 ? (
                            <p className="planning-empty-text">No hay movimientos previstos pendientes.</p>
                        ) : (
                            <ul className="planning-upcoming__list">
                                {overview.upcoming.map((item) => (
                                    <li key={item.id}>
                                        <span className="planning-upcoming__date">
                                            <strong>{dayjs(item.dueDate).format("D")}</strong>
                                            <small>{dayjs(item.dueDate).format("MMM")}</small>
                                        </span>
                                        <div className="planning-upcoming__body">
                                            <strong>{item.name}</strong>
                                            <small>
                                                {item.category?.name ?? "Sin categoría"}
                                                {item.account ? ` · ${item.account.name}` : ""}
                                            </small>
                                        </div>
                                        <strong className={item.type === "INCOME" ? "text-success" : "text-danger"}>
                                            {item.type === "INCOME" ? "+" : "−"} {formatCurrency(item.amount)}
                                        </strong>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                </div>
            ) : (
                <div className="planning-embedded" role="tabpanel">
                    {tab === "recurring" && <RecurringPaymentsPage />}
                    {tab === "subscriptions" && <SubscriptionsPage />}
                    {tab === "budgets" && <BudgetsPage />}
                </div>
            )}
        </div>
    );
}
