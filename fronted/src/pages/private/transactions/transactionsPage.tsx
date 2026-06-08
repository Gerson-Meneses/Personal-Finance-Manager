import { useCallback } from "react"
import { useTransactions } from "../../../features/transactions/hooks"
import TransactionItem from "../../../features/transactions/components/TransactionItem"
import TransactionsFilters from "../../../features/transactions/components/TransactionsFilters/TransactionsFilters"
import LoadingScreen from "../../../shared/components/LoadingScreen/LoadingScreen"
import { defaultTransactionsQueryFilters, type Transaction, type TransactionQuerySchemaOutput } from "../../../features/transactions/types"
import "./TransactionsPage.css"
import { useFilterURL } from "../../../shared/Hooks/UseFiltersUrl.hook"
import { ListHistory } from "../../../shared/components/ListHistory/ListHistory"
import { useClientSearch } from "../../../shared/Hooks/UseClientSearch"
import { normalizeTransaction } from "../../../features/transactions/utils/Normalizetransaction"


export function TransactionsPage() {
    const {
        filters: query,
        saveFiltersToURL,
        clearFiltersFromURL,
    } = useFilterURL<TransactionQuerySchemaOutput>(defaultTransactionsQueryFilters)

    const { search, setSearch, filtered } = useClientSearch(
        useCallback(normalizeTransaction, [])
    )

    // Cuando hay búsqueda activa traemos todo para filtrar client-side,
    // ignorando la paginación del backend temporalmente
    const queryForBackend = search
        ? { ...query, limit: 9999, page: 1 }
        : query

    const { transactions, loading, error, meta } = useTransactions(queryForBackend)

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

    return (
        <div className="page-container">

            <header className="card page-header">
                <div>
                    <h1>Transacciones</h1>
                    <p className="text-muted">
                        <span className="dot-base dot-bg-muted"></span>
                        {search
                            ? `${filteredTransactions.length} de ${meta?.total ?? 0} resultado${filteredTransactions.length !== 1 ? "s" : ""}`
                            : `${meta?.total ?? 0} resultado${meta?.total !== 1 ? "s" : ""}`
                        }
                    </p>
                </div>
            </header>

            <TransactionsFilters
                query={query}
                onChange={handleFiltersChange}
                onReset={clearFiltersFromURL}
                search={search}
                onSearchChange={setSearch}
            />

            {filteredTransactions.length === 0 ? (
                <div className="empty-state">
                    <p>Sin transacciones para los filtros seleccionados.</p>
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
                        onClick={() => handlePageChange((Number(query.page) ?? 1) - 1)}
                    >
                        ← Anterior
                    </button>
                    <span className="tf-page-info">
                        Página {Number(query.page) ?? 1}/{meta.totalPages}
                    </span>
                    <button
                        className="btn-secondary"
                        disabled={query.page ? Number(query.page) >= meta.totalPages : false}
                        onClick={() => handlePageChange((Number(query.page) ?? 1) + 1)}
                    >
                        Siguiente →
                    </button>
                </div>
            )}

        </div>
    )
}