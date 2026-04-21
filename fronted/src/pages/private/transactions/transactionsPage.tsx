import { useState } from "react"
import { useTransactions } from "../../../features/transactions/hooks"
import TransactionItem from "../../../features/transactions/components/TransactionItem"
import TransactionsFilters from "../../../features/transactions/components/TransactionsFilters/TransactionsFilters"
import LoadingScreen from "../../../shared/components/LoadingScreen/LoadingScreen"
import type { Transaction, TransactionQuerySchema } from "../../../features/transactions/types"
import "./TransactionsPage.css"
import dayjs from "dayjs"

const DEFAULT_QUERY: TransactionQuerySchema = {
    order: "DESC",
    limit: 20,
    page: 1,
}

export function TransactionsPage() {
    const [query, setQuery] = useState<TransactionQuerySchema>(DEFAULT_QUERY)
    const { transactions, loading, error, meta } = useTransactions(query)

    if (loading) return <LoadingScreen message="Cargando transacciones..." />
    if (error instanceof Error) return (
        <div className="page-container">
            <div className="empty-state">
                <p className="text-muted">{error.message}</p>
            </div>
        </div>
    )

    const grouped = transactions.reduce((acc, tx) => {
        if (!acc[tx.date]) acc[tx.date] = []
        acc[tx.date].push(tx)
        return acc
    }, {} as Record<string, Transaction[]>)

    const sortedDates = Object.keys(grouped).sort(
        (a, b) => new Date(b).getTime() - new Date(a).getTime()
    )

    return (
        <div className="page-container">

            <header className="card page-header">
                <div>
                    <h1>Transacciones</h1>
                    <p className=" text-muted">
                       <span className="dot-base dot-bg-muted"></span> {meta.total} resultado{meta.total !== 1 ? "s" : ""}
                    </p>
                </div>
            </header>

            <TransactionsFilters
                query={query}
                onChange={q => setQuery({ ...q, page: 1 })}
                onReset={() => setQuery(DEFAULT_QUERY)}
            />

            {transactions.length === 0 ? (
                <div className="empty-state">
                    <p>Sin transacciones para los filtros seleccionados.</p>
                </div>
            ) : (
                <div className="card tx-grouped-list">
                    {sortedDates.map(date => (
                        <div key={date} className="tx-date-group">
                            <div className="tx-date-header">
                                <span>{dayjs(date).format("dddd D")}</span>
                                <span className="badge badge-mutted">{grouped[date].length}</span>
                            </div>
                            {grouped[date].map(tx => (
                                <TransactionItem key={tx.id} transaction={tx} />
                            ))}
                        </div>
                    ))}
                </div>
            )}

            {/* Paginación */}
            {meta.totalPages > 1 && (
                <div className="tf-pagination">
                    <button
                        className="btn-secondary"
                        disabled={!query.page || query.page <= 1}
                        onClick={() => setQuery(q => ({ ...q, page: (q.page ?? 1) - 1 }))}
                    >
                        ← Anterior
                    </button>
                    <span className="tf-page-info">
                        Página {query.page ?? 1}/{meta.totalPages}
                    </span>
                    <button
                        className="btn-secondary"
                        disabled={transactions.length < (query.limit ?? 20)}
                        onClick={() => setQuery(q => ({ ...q, page: (q.page ?? 1) + 1 }))}
                    >
                        Siguiente →
                    </button>
                </div>
            )}
        </div>
    )
}