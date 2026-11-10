import { List, TrendingDown, TrendingUp, Wallet } from "lucide-react"
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
