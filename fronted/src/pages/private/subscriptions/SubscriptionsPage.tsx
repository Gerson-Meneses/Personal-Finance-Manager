import { useState } from "react";
import { Link } from "react-router-dom";
import dayjs from "dayjs";
import "dayjs/locale/es";
import {
    ArrowRight,
    CalendarClock,
    CreditCard,
    Pause,
    Play,
    ReceiptText,
    RefreshCw,
    Repeat,
    TrendingDown,
    TrendingUp,
} from "lucide-react";
import LoadingScreen from "../../../shared/components/LoadingScreen/LoadingScreen";
import { formatCurrency } from "../../../shared/utils/formatCurrency";
import { getIcon } from "../../../shared/utils/GetIcon";
import { useToast } from "../../../shared/Hooks/useToast";
import { useBudgets } from "../../../features/budgets/hooks";
import { useSubscriptionHub } from "../../../features/subscriptions/hooks";
import type {
    SubscriptionItem,
    SubscriptionSummary,
} from "../../../features/subscriptions/types";
import "./SubscriptionsPage.css";

dayjs.locale("es");

type SubscriptionFilter = "ALL" | "ACTIVE" | "PAUSED";

const FREQUENCY_LABEL: Record<SubscriptionItem["frequency"], string> = {
    MONTHLY: "Mensual",
    WEEKLY: "Semanal",
    BIWEEKLY: "Cada 2 semanas",
    FIFTEEN_DAYS: "Cada 15 días",
    YEARLY: "Anual",
    ONCE: "Único",
};

function scheduleLabel(item: SubscriptionItem) {
    const base = FREQUENCY_LABEL[item.frequency];
    return item.intervalCount > 1 ? `${base} · cada ${item.intervalCount}` : base;
}

function SummaryCards({ summary }: { summary: SubscriptionSummary }) {
    return (
        <section className="subscriptions-summary" aria-label="Resumen de suscripciones">
            <article className="subscriptions-kpi card">
                <span className="subscriptions-kpi__icon is-monthly"><Repeat size={17} /></span>
                <div>
                    <span>Gasto mensual</span>
                    <strong className="amount-font">{formatCurrency(summary.monthlyTotal)}</strong>
                    <small>Solo suscripciones activas</small>
                </div>
            </article>

            <article className="subscriptions-kpi card">
                <span className="subscriptions-kpi__icon is-yearly"><CreditCard size={17} /></span>
                <div>
                    <span>Gasto anual</span>
                    <strong className="amount-font">{formatCurrency(summary.yearlyTotal)}</strong>
                    <small>Proyección a 12 meses</small>
                </div>
            </article>

            <article className="subscriptions-kpi card">
                <span className="subscriptions-kpi__icon is-active"><ReceiptText size={17} /></span>
                <div>
                    <span>Activas</span>
                    <strong className="amount-font">{summary.activeCount}</strong>
                    <small>{summary.pausedCount} pausada{summary.pausedCount === 1 ? "" : "s"}</small>
                </div>
            </article>

            <article className="subscriptions-kpi card">
                <span className="subscriptions-kpi__icon is-next"><CalendarClock size={17} /></span>
                <div>
                    <span>Próximo cobro</span>
                    <strong className="amount-font">
                        {summary.nextCharge ? formatCurrency(summary.nextCharge.amount) : "—"}
                    </strong>
                    <small>
                        {summary.nextCharge
                            ? `${summary.nextCharge.name} · ${dayjs(summary.nextCharge.date).format("D MMM")}`
                            : "Sin cobros próximos"}
                    </small>
                </div>
            </article>
        </section>
    );
}

function PriceChange({ item }: { item: SubscriptionItem }) {
    if (item.priceChange === null || item.priceChange === undefined || Math.abs(item.priceChange) < 0.01) {
        return null;
    }

    const up = item.priceChange > 0;
    return (
        <span className={`subscriptions-price ${up ? "is-up" : "is-down"}`}>
            {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {up ? "Subió" : "Bajó"} {formatCurrency(Math.abs(item.priceChange))} desde el último cobro
        </span>
    );
}

export default function SubscriptionsPage() {
    const [filter, setFilter] = useState<SubscriptionFilter>("ALL");
    const { hub, loading, error, refetch, toggleSubscription } = useSubscriptionHub();
    const { data: budgetData } = useBudgets(dayjs().format("YYYY-MM"));
    const toast = useToast();
    const budgetByCategory = new Map(
        (budgetData?.budgets ?? []).map((budget) => [budget.category.id, budget])
    );

    if (loading && !hub) return <LoadingScreen message="Cargando suscripciones..." />;

    if (error && !hub) {
        return (
            <div className="page-container">
                <div className="empty-state card">
                    <p className="text-muted">
                        {error instanceof Error ? error.message : "No se pudieron cargar las suscripciones."}
                    </p>
                    <button className="btn-primary" onClick={() => refetch()}>
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    if (!hub) return null;

    const items = hub.subscriptions.filter((item) => {
        if (filter === "ACTIVE") return item.isActive;
        if (filter === "PAUSED") return !item.isActive;
        return true;
    });

    const handleToggle = async (item: SubscriptionItem) => {
        try {
            await toggleSubscription.mutateAsync({ id: item.id, isActive: !item.isActive });
            toast.success(item.isActive ? "Suscripción pausada" : "Suscripción reactivada");
        } catch (toggleError) {
            toast.error(
                toggleError instanceof Error
                    ? toggleError.message
                    : "No se pudo actualizar la suscripción"
            );
        }
    };

    return (
        <div className="page-container subscriptions-page">
            <header className="subscriptions-header card">
                <div>
                    <span className="subscriptions-header__eyebrow">Gastos recurrentes</span>
                    <h1>Hub de suscripciones</h1>
                    <p className="text-muted">
                        Controla tus servicios y cobros recurrentes en un solo lugar.
                    </p>
                </div>
                <div className="subscriptions-header__actions">
                    <button
                        type="button"
                        className="btn-secondary subscriptions-refresh"
                        onClick={() => refetch()}
                        disabled={loading}
                    >
                        <RefreshCw size={15} />
                        Actualizar
                    </button>
                    <Link className="btn-primary subscriptions-manage" to="/planning?tab=recurring">
                        Gestionar
                        <ArrowRight size={15} />
                    </Link>
                </div>
            </header>

            <SummaryCards summary={hub.summary} />

            <section className="subscriptions-toolbar card">
                <div className="subscriptions-filters" role="group" aria-label="Filtrar suscripciones">
                    {([
                        { value: "ALL", label: `Todas (${hub.subscriptions.length})` },
                        { value: "ACTIVE", label: `Activas (${hub.summary.activeCount})` },
                        { value: "PAUSED", label: `Pausadas (${hub.summary.pausedCount})` },
                    ] as { value: SubscriptionFilter; label: string }[]).map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            className={`subscriptions-chip ${filter === option.value ? "is-active" : ""}`}
                            aria-pressed={filter === option.value}
                            onClick={() => setFilter(option.value)}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
                <small className="text-muted">
                    Los importes mensuales se normalizan según la frecuencia de cada cobro.
                </small>
            </section>

            {items.length === 0 ? (
                <div className="empty-state card subscriptions-empty">
                    <span className="subscriptions-empty__icon"><Repeat size={22} /></span>
                    <h3>{hub.subscriptions.length === 0 ? "Aún no tienes suscripciones" : "No hay resultados"}</h3>
                    <p className="text-muted">
                        {hub.subscriptions.length === 0
                            ? "Crea un pago futuro de gasto para verlo aquí como suscripción."
                            : "Cambia el filtro para ver otras suscripciones."}
                    </p>
                    {hub.subscriptions.length === 0 && (
                        <Link className="btn-primary" to="/planning?tab=recurring">
                            Crear pago futuro
                        </Link>
                    )}
                </div>
            ) : (
                <section className="subscriptions-grid" aria-label="Listado de suscripciones">
                    {items.map((item) => {
                        const budget = item.category?.id
                            ? budgetByCategory.get(item.category.id)
                            : undefined;

                        return (
                        <article
                            key={item.id}
                            className={`subscriptions-card card ${item.isActive ? "" : "is-paused"}`}
                        >
                            <div className="subscriptions-card__head">
                                <span
                                    className="subscriptions-card__icon"
                                    style={{ color: item.category?.color ?? "var(--accent)" }}
                                >
                                    {getIcon(item.category?.icon ?? "Repeat", { size: 20 })}
                                </span>
                                <div className="subscriptions-card__title">
                                    <strong>{item.name}</strong>
                                    <small>
                                        {item.category?.name ?? "Sin categoría"}
                                        {item.account ? ` · ${item.account.name}` : ""}
                                    </small>
                                </div>
                                <span className={`subscriptions-status ${item.isActive ? "is-active" : "is-paused"}`}>
                                    {item.isActive ? "Activa" : "Pausada"}
                                </span>
                            </div>

                            <div className="subscriptions-card__amount">
                                <strong className="amount-font">{formatCurrency(item.amount)}</strong>
                                <span>{scheduleLabel(item)}</span>
                            </div>

                            <dl className="subscriptions-card__meta">
                                <div>
                                    <dt>Equivalente mensual</dt>
                                    <dd>{formatCurrency(item.monthlyEquivalent)}</dd>
                                </div>
                                <div>
                                    <dt>Próximo cobro</dt>
                                    <dd>
                                        {item.nextDueDate
                                            ? dayjs(item.nextDueDate).format("D MMM YYYY")
                                            : "—"}
                                    </dd>
                                </div>
                                <div>
                                    <dt>Débito</dt>
                                    <dd>{item.autoDebit ? "Automático" : "Manual"}</dd>
                                </div>
                            </dl>

                            {budget && (
                                <span
                                    className={`subscriptions-budget ${
                                        budget.percentage >= 100
                                            ? "is-over"
                                            : budget.percentage >= 80
                                                ? "is-warning"
                                                : ""
                                    }`}
                                >
                                    Presupuesto {budget.percentage}% · {formatCurrency(budget.remaining)} disponible
                                </span>
                            )}

                            <PriceChange item={item} />

                            <div className="subscriptions-card__actions">
                                <button
                                    type="button"
                                    className="btn-secondary subscriptions-toggle"
                                    onClick={() => handleToggle(item)}
                                    disabled={toggleSubscription.isPending}
                                >
                                    {item.isActive ? <Pause size={14} /> : <Play size={14} />}
                                    {item.isActive ? "Pausar" : "Reactivar"}
                                </button>
                                <Link className="btn-ghost subscriptions-link" to="/planning?tab=recurring">
                                    Ver detalle
                                    <ArrowRight size={14} />
                                </Link>
                            </div>
                        </article>
                        );
                    })}
                </section>
            )}
        </div>
    );
}
