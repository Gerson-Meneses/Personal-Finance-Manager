import { useState } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import "dayjs/locale/es";
import {
    ArrowDownLeft,
    ArrowUpRight,
    ChartNoAxesCombined,
    List,
    PiggyBank,
    RefreshCw,
    TrendingDown,
    TrendingUp,
    Wallet,
} from "lucide-react";
import LoadingScreen from "../../../shared/components/LoadingScreen/LoadingScreen";
import { formatCurrency } from "../../../shared/utils/formatCurrency";
import { useMonthlyReport } from "../../../features/reports/hooks";
import { MonthlyTrendChart } from "../../../features/reports/components/MonthlyTrendChart";
import { CategoryTrendChart } from "../../../features/reports/components/CategoryTrendChart";
import { CategoryDonut } from "../../../features/reports/components/CategoryDonut";
import { ReportHighlightsCard } from "../../../features/reports/components/ReportHighlightsCard";
import "./ReportsPage.css";

dayjs.locale("es");

const RANGE_OPTIONS = [3, 6, 12, 24] as const;

const periodLabel = (from: string, to: string) =>
    `${dayjs(`${from}-01`).format("MMM YYYY")} — ${dayjs(`${to}-01`).format("MMM YYYY")}`;

export default function ReportsPage() {
    const [months, setMonths] = useState<number>(6);
    const navigate = useNavigate();
    const { report, loading, fetching, error, refetch } = useMonthlyReport(months);

    if (loading && !report) {
        return <LoadingScreen message="Calculando reportes..." />;
    }

    if (error && !report) {
        return (
            <div className="page-container">
                <div className="empty-state card">
                    <p className="text-muted">
                        {error instanceof Error
                            ? error.message
                            : "No se pudieron cargar los reportes."}
                    </p>
                    <button className="btn-primary" onClick={() => refetch()}>
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    if (!report) return null;

    const {
        totals,
        months: series,
        expenseCategories,
        incomeCategories,
        topExpenses,
        highlights,
        range,
    } = report;

    const hasData = totals.transactionCount > 0;
    const maxTopExpense = topExpenses.reduce(
        (max, item) => Math.max(max, item.total),
        0
    );

    return (
        <div className="page-container reports-page">
            <header className="reports-header card">
                <div className="reports-header__text">
                    <span className="reports-header__eyebrow">
                        Analítica multi-mes
                    </span>
                    <h1>Reportes</h1>
                    <p className="text-muted">
                        Compara ingresos y gastos en el tiempo y descubre
                        dónde se va tu dinero.
                    </p>
                </div>

                <div className="reports-header__actions">
                    <div
                        className="reports-range"
                        role="group"
                        aria-label="Periodo de análisis"
                    >
                        {RANGE_OPTIONS.map((option) => (
                            <button
                                key={option}
                                type="button"
                                className={`reports-range__chip ${months === option ? "is-active" : ""}`}
                                onClick={() => setMonths(option)}
                            >
                                {option} meses
                            </button>
                        ))}
                    </div>

                    <button
                        type="button"
                        className="btn-secondary reports-refresh"
                        onClick={() => refetch()}
                        disabled={fetching}
                    >
                        <RefreshCw
                            size={15}
                            className={fetching ? "is-spinning" : ""}
                        />
                        Actualizar
                    </button>
                </div>
            </header>

            {error && report && (
                <div className="error-banner">
                    No se pudieron actualizar los datos. Se muestra la última
                    versión disponible.
                </div>
            )}

            {!hasData ? (
                <div className="empty-state card report-empty">
                    <span className="report-empty__icon">
                        <ChartNoAxesCombined size={22} />
                    </span>
                    <h3>Sin datos para este periodo</h3>
                    <p className="text-muted">
                        Registra ingresos y gastos para ver la analítica de{" "}
                        {periodLabel(range.from, range.to)}.
                    </p>
                    <button
                        className="btn-primary"
                        onClick={() => navigate("/transactions")}
                    >
                        <List size={16} /> Ir a transacciones
                    </button>
                </div>
            ) : (
                <>
                    <section className="reports-kpis">
                        <article className="report-kpi card">
                            <span className="report-kpi__icon is-income">
                                <TrendingUp size={17} />
                            </span>
                            <div>
                                <span className="report-kpi__label">Ingresos</span>
                                <strong className="amount-font text-success">
                                    {formatCurrency(totals.income)}
                                </strong>
                                <small>
                                    Promedio {formatCurrency(totals.avgIncome)}/mes
                                </small>
                            </div>
                        </article>

                        <article className="report-kpi card">
                            <span className="report-kpi__icon is-expense">
                                <TrendingDown size={17} />
                            </span>
                            <div>
                                <span className="report-kpi__label">Gastos</span>
                                <strong className="amount-font text-danger">
                                    {formatCurrency(totals.expense)}
                                </strong>
                                <small>
                                    Promedio {formatCurrency(totals.avgExpense)}/mes
                                </small>
                            </div>
                        </article>

                        <article className="report-kpi card">
                            <span className="report-kpi__icon is-net">
                                <Wallet size={17} />
                            </span>
                            <div>
                                <span className="report-kpi__label">Balance</span>
                                <strong
                                    className={`amount-font ${totals.net >= 0 ? "text-success" : "text-danger"}`}
                                >
                                    {formatCurrency(totals.net)}
                                </strong>
                                <small>
                                    Promedio {formatCurrency(totals.avgNet)}/mes
                                </small>
                            </div>
                        </article>

                        <article className="report-kpi card">
                            <span className="report-kpi__icon is-savings">
                                <PiggyBank size={17} />
                            </span>
                            <div>
                                <span className="report-kpi__label">
                                    Tasa de ahorro
                                </span>
                                <strong
                                    className={`amount-font ${totals.savingsRate >= 20 ? "text-success" : totals.savingsRate >= 0 ? "text-warning" : "text-danger"}`}
                                >
                                    {totals.savingsRate}%
                                </strong>
                                <small>Sobre tus ingresos</small>
                            </div>
                        </article>
                    </section>

                    <section className="reports-main-grid">
                        <article className="card report-panel report-panel--wide">
                            <div className="report-panel__head">
                                <div>
                                    <h2>Flujo mensual</h2>
                                    <p className="text-muted">
                                        {periodLabel(range.from, range.to)}
                                    </p>
                                </div>
                            </div>
                            <MonthlyTrendChart months={series} />
                        </article>

                        <ReportHighlightsCard
                            highlights={highlights}
                            totals={totals}
                        />
                    </section>

                    <section className="reports-chart-grid">
                        <article className="card report-panel">
                            <div className="report-panel__head">
                                <div>
                                    <h2>Gastos por categoría</h2>
                                    <p className="text-muted">
                                        Evolución mes a mes de tus principales rubros
                                    </p>
                                </div>
                            </div>
                            {expenseCategories.length === 0 ? (
                                <div className="report-empty-inline">
                                    <p>Sin gastos por categoría en este periodo.</p>
                                </div>
                            ) : (
                                <CategoryTrendChart
                                    months={series}
                                    categories={expenseCategories}
                                />
                            )}
                        </article>

                        <article className="card report-panel">
                            <div className="report-panel__head">
                                <div>
                                    <h2>Composición de gastos</h2>
                                    <p className="text-muted">
                                        Distribución acumulada del periodo
                                    </p>
                                </div>
                            </div>
                            <CategoryDonut
                                categories={expenseCategories}
                                total={totals.expense}
                            />
                        </article>
                    </section>

                    <section className="reports-list-grid">
                        <article className="card report-panel">
                            <div className="report-panel__head">
                                <div>
                                    <h2>
                                        <ArrowUpRight size={16} />
                                        Mayores gastos
                                    </h2>
                                    <p className="text-muted">
                                        Movimientos que más pesaron en el periodo
                                    </p>
                                </div>
                            </div>

                            {topExpenses.length === 0 ? (
                                <div className="report-empty-inline">
                                    <p>Sin gastos registrados.</p>
                                </div>
                            ) : (
                                <ol className="report-ranking">
                                    {topExpenses.map((item, index) => (
                                        <li key={item.name}>
                                            <span className="report-ranking__index">
                                                {index + 1}
                                            </span>
                                            <div className="report-ranking__body">
                                                <span className="report-ranking__name">
                                                    {item.name}
                                                </span>
                                                <small>
                                                    {item.count} movimiento
                                                    {item.count === 1 ? "" : "s"}
                                                </small>
                                                <span className="report-ranking__bar">
                                                    <span
                                                        className="report-ranking__fill is-danger"
                                                        style={{
                                                            width: `${maxTopExpense > 0 ? Math.max(4, (item.total / maxTopExpense) * 100) : 0}%`,
                                                        }}
                                                    />
                                                </span>
                                            </div>
                                            <strong className="amount-font text-danger">
                                                {formatCurrency(item.total)}
                                            </strong>
                                        </li>
                                    ))}
                                </ol>
                            )}
                        </article>

                        <article className="card report-panel">
                            <div className="report-panel__head">
                                <div>
                                    <h2>
                                        <ArrowDownLeft size={16} />
                                        Fuentes de ingreso
                                    </h2>
                                    <p className="text-muted">
                                        De dónde vino tu dinero en el periodo
                                    </p>
                                </div>
                            </div>

                            {incomeCategories.length === 0 ? (
                                <div className="report-empty-inline">
                                    <p>Sin ingresos registrados.</p>
                                </div>
                            ) : (
                                <ul className="report-sources">
                                    {incomeCategories.slice(0, 8).map((category) => {
                                        const percent = totals.income > 0
                                            ? Math.round(
                                                (category.total / totals.income) * 100
                                            )
                                            : 0;

                                        return (
                                            <li key={category.id ?? category.name}>
                                                <span
                                                    className="report-sources__dot"
                                                    style={{
                                                        background: category.color,
                                                    }}
                                                />
                                                <div className="report-sources__body">
                                                    <span className="report-sources__name">
                                                        {category.name}
                                                    </span>
                                                    <small>
                                                        {category.count} movimiento
                                                        {category.count === 1 ? "" : "s"}
                                                    </small>
                                                </div>
                                                <strong className="amount-font">
                                                    {formatCurrency(category.total)}
                                                </strong>
                                                <span className="report-sources__pct">
                                                    {percent}%
                                                </span>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </article>
                    </section>
                </>
            )}
        </div>
    );
}
