import { List, TrendingDown, TrendingUp, Wallet, CalendarDays, ChevronLeft, ChevronRight } from "lucide-react"
import dayjs from "dayjs"
import "dayjs/locale/es"
import { useTransactions, useTransactionsStats } from "../../../features/transactions/hooks"
import TransactionItem from "../../../features/transactions/components/TransactionItem"
import TransactionsFilters from "../../../features/transactions/components/TransactionsFilters/TransactionsFilters"
import LoadingScreen from "../../../shared/components/LoadingScreen/LoadingScreen"
import { defaultTransactionsQueryFilters, type Transaction, type TransactionQuerySchemaOutput } from "../../../features/transactions/types"
import "./TransactionsPage.css"
import { useFilterURL } from "../../../shared/Hooks/UseFiltersUrl.hook"
import { ListHistory } from "../../../shared/components/ListHistory/ListHistory"
import { useClientSearch } from "../../../shared/Hooks/UseClientSearch"
import { normalizeTransaction } from "../../../features/transactions/utils/Normalizetransaction"
import { formatCurrency } from "../../../shared/utils/formatCurrency"

dayjs.locale("es");

export function TransactionsPage() {
    const {
        filters: query,
        saveFiltersToURL,
        clearFiltersFromURL,
    } = useFilterURL<TransactionQuerySchemaOutput>(defaultTransactionsQueryFilters)

    const { search, setSearch, filtered } = useClientSearch(normalizeTransaction)

    // Cuando hay búsqueda activa traemos todo para filtrar client-side,
    // ignorando la paginación del backend temporalmente
    const queryForBackend = search
        ? { ...query, limit: 9999, page: 1 }
        : query

    const { transactions, loading, error, meta } = useTransactions(queryForBackend)
    const { stats } = useTransactionsStats({ ...query, search: search || undefined })

    // Alimentamos el hook con los datos frescos del backend
    const filteredTransactions = filtered(transactions)

    if (loading) return <LoadingScreen message="Cargando transacciones..." />
    if (error instanceof Error) return (
        <div className="page-container">
            <div className="empty-state">
                <p className="text-muted">{error.message}</p>
            </div>
        </div>
    )

    const handleFiltersChange = (newFilters: TransactionQuerySchemaOutput) => {
        saveFiltersToURL({ ...newFilters, page: 1 })
    }

    const handlePageChange = (newPage: number) => {
        saveFiltersToURL({ ...query, page: newPage })
    }

    const netClass = (stats?.net ?? 0) >= 0 ? "text-success" : "text-danger"
    const resultLabel = search
        ? `${filteredTransactions.length} de ${meta?.total ?? 0}`
        : `${meta?.total ?? 0}`

    const activeMonth = (() => {
        if (!query.from || !query.to) return ""
        const from = dayjs(query.from)
        const to = dayjs(query.to)
        const isFullMonth =
            from.isSame(from.startOf("month"), "day") &&
            to.isSame(to.endOf("month"), "day")
        const isCurrentMonthToToday =
            from.isSame(from.startOf("month"), "day") &&
            to.isSame(dayjs().startOf("day"), "day")
        return isFullMonth || isCurrentMonthToToday ? from.format("YYYY-MM") : ""
    })()

    const hasPeriod = !!activeMonth || !!query.date || !!query.from || !!query.to
    const currentMonth = dayjs().format("YYYY-MM")
    const canGoNextMonth = !!activeMonth && activeMonth < currentMonth

    const periodLabel = activeMonth
        ? dayjs(`${activeMonth}-01`).format("MMMM YYYY")
        : query.date
            ? dayjs(query.date).format("DD MMM YYYY")
            : (query.from || query.to)
                ? `${query.from ? dayjs(query.from).format("DD MMM") : "…"} – ${query.to ? dayjs(query.to).format("DD MMM") : "…"}`
                : "Todos los movimientos"

    const shiftMonth = (delta: number) => {
        const base = activeMonth ? dayjs(`${activeMonth}-01`) : dayjs().startOf("month")
        const target = base.add(delta, "month")
        const from = target.startOf("month").format("YYYY-MM-DD")
        const to = target.isSame(dayjs(), "month")
            ? dayjs().format("YYYY-MM-DD")
            : target.endOf("month").format("YYYY-MM-DD")

        saveFiltersToURL({ ...query, date: undefined, from, to, page: 1 })
    }

    const clearPeriod = () => {
        saveFiltersToURL({ ...query, date: undefined, from: undefined, to: undefined, page: 1 })
    }

    return (
        <div className="page-container tx-page">

            <header className="tx-page-header card">
                <div className="tx-page-header__text">
                    <span className="tx-page-header__eyebrow">Movimientos</span>
                    <h1>Transacciones</h1>
                    <p className="text-muted">
                        Revisa, filtra y analiza cada ingreso y gasto.
                    </p>
                </div>
                <span className="tx-page-header__count">
                    {resultLabel} resultado{Number(resultLabel.split(" ")[0]) !== 1 ? "s" : ""}
                </span>
            </header>

            <section className="tx-period-bar card">
                <div className="tx-period-bar__main">
                    <span className="tx-period-bar__eyebrow">
                        <CalendarDays size={15} />
                        Periodo
                    </span>

                    <div className="tx-period-bar__nav">
                        <button
                            type="button"
                            className="tx-period-bar__arrow"
                            onClick={() => shiftMonth(-1)}
                            aria-label="Mes anterior"
                        >
                            <ChevronLeft size={16} />
                        </button>

                        <span className="tx-period-bar__value">{periodLabel}</span>

                        <button
                            type="button"
                            className="tx-period-bar__arrow"
                            onClick={() => shiftMonth(1)}
                            disabled={!canGoNextMonth}
                            aria-label="Mes siguiente"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>

                {hasPeriod && (
                    <button type="button" className="tx-period-bar__clear" onClick={clearPeriod}>
                        Todo el tiempo
                    </button>
                )}
            </section>

            <section className="tx-stats">
                <article className="tx-stat card tx-stat--income">
                    <span className="tx-stat__icon"><TrendingUp size={17} /></span>
                    <div>
                        <span className="tx-stat__label">Ingresos</span>
                        <strong className="amount-font">{formatCurrency(stats?.income ?? 0)}</strong>
                    </div>
                </article>

                <article className="tx-stat card tx-stat--expense">
                    <span className="tx-stat__icon"><TrendingDown size={17} /></span>
                    <div>
                        <span className="tx-stat__label">Gastos</span>
                        <strong className="amount-font">{formatCurrency(stats?.expense ?? 0)}</strong>
                    </div>
                </article>

                <article className="tx-stat card tx-stat--net">
                    <span className="tx-stat__icon"><Wallet size={17} /></span>
                    <div>
                        <span className="tx-stat__label">Balance</span>
                        <strong className={`amount-font ${netClass}`}>{formatCurrency(stats?.net ?? 0)}</strong>
                    </div>
                </article>

                <article className="tx-stat card tx-stat--count">
                    <span className="tx-stat__icon"><List size={17} /></span>
                    <div>
                        <span className="tx-stat__label">Movimientos</span>
                        <strong className="amount-font">{stats?.count ?? meta?.total ?? 0}</strong>
                    </div>
                </article>
            </section>

            <TransactionsFilters
                query={query}
                onChange={handleFiltersChange}
                onReset={clearFiltersFromURL}
                search={search}
                onSearchChange={setSearch}
            />

            {filteredTransactions.length === 0 ? (
                <div className="empty-state card tx-empty">
                    <span className="tx-empty__icon"><List size={22} /></span>
                    <h3>Sin transacciones</h3>
                    <p className="text-muted">
                        {search
                            ? `No hay coincidencias para «${search}».`
                            : "No hay movimientos para los filtros seleccionados."}
                    </p>
                    {(search || Object.keys(query).some((key) => !["page", "limit", "order", "orderBy"].includes(key))) && (
                        <button
                            className="btn-secondary"
                            onClick={() => {
                                setSearch("");
                                clearFiltersFromURL();
                            }}
                        >
                            Limpiar filtros
                        </button>
                    )}
                </div>
            ) : (
                <div className="card tx-grouped-list">
                    <ListHistory<Transaction>
                        title="Historial"
                        items={filteredTransactions}
                        groupByDate
                        renderItem={(item) => (
                            <TransactionItem
                                transaction={item}
                                search={search}
                            />
                        )}
                    />
                </div>
            )}

            {/* Paginación solo visible cuando no hay búsqueda activa */}
            {!search && meta?.totalPages > 1 && (
                <div className="tf-pagination">
                    <button
                        className="btn-secondary"
                        disabled={!query.page || Number(query.page) <= 1}
                        onClick={() => handlePageChange((Number(query.page) || 1) - 1)}
                    >
                        ← Anterior
                    </button>
                    <span className="tf-page-info">
                        Página {Number(query.page) || 1}/{meta.totalPages}
                    </span>
                    <button
                        className="btn-secondary"
                        disabled={(Number(query.page) || 1) >= meta.totalPages}
                        onClick={() => handlePageChange((Number(query.page) || 1) + 1)}
                    >
                        Siguiente →
                    </button>
                </div>
            )}

        </div>
    )
}
