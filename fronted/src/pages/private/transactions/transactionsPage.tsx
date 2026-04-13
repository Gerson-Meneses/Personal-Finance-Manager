import { useState } from "react"
import { useTransactions } from "../../../features/transactions/hooks"
import TransactionItem from "../../../features/transactions/components/TransactionItem"
import LoadingScreen from "../../../shared/components/LoadingScreen/LoadingScreen"
import type { Transaction } from "../../../features/transactions/types"
import { format } from "date-fns"
import "./TransactionsPage.css"

export function TransactionsPage() {
    const { transactions, loading, error } = useTransactions()
    const [filter, setFilter] = useState<"ALL" | "INCOME" | "EXPENSE">("ALL")

    if (loading) return <LoadingScreen message="Cargando transacciones..." />
    if (error instanceof Error) return <p className="text-muted" style={{ padding: "2rem" }}>{error.message}</p>

    const filtered = filter === "ALL"
        ? transactions
        : transactions.filter(tx => tx.type === filter)

    const grouped = filtered.reduce((acc, tx) => {
        const date = tx.date
        if (!acc[date]) acc[date] = []
        acc[date].push(tx)
        return acc
    }, {} as Record<string, Transaction[]>)

    const sortedDates = Object.keys(grouped).sort(
        (a, b) => new Date(b).getTime() - new Date(a).getTime()
    )

    return (
        <div className="page-container transactions-page">

            <header className="page-header">
                <div>
                    <h1>Transacciones</h1>
                    <p className="text-muted">
                        {transactions.length} movimiento{transactions.length !== 1 ? "s" : ""} registrado{transactions.length !== 1 ? "s" : ""}
                    </p>
                </div>
            </header>

            {/* Filtros */}
            <div className="tx-filter-bar">
                {(["ALL", "INCOME", "EXPENSE"] as const).map(f => (
                    <button
                        key={f}
                        className={`tx-filter-btn ${filter === f ? "active " + f.toLowerCase() : ""}`}
                        onClick={() => setFilter(f)}
                    >
                        {f === "ALL" ? "Todos" : f === "INCOME" ? "Ingresos" : "Gastos"}
                    </button>
                ))}
            </div>

            {/* Lista agrupada por fecha */}
            {transactions.length === 0 ? (
                <div className="dashboard-card" style={{ textAlign: "center", padding: "48px 20px" }}>
                    <p className="text-muted">Sin transacciones registradas.</p>
                </div>
            ) : (
                <div className="tx-grouped-list">
                    {sortedDates.map(date => (
                        <div key={date} className="tx-date-group">
                            <div className="tx-date-header">
                                <span>{format(new Date(date), "dd/MM/yyyy")}</span>
                                <span className="tx-date-count">{grouped[date].length}</span>
                            </div>
                            {grouped[date].map(tx => (
                                <TransactionItem key={tx.id} transaction={tx} />
                            ))}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}






/* //////////////////////////////////////////////////////////////////////////////////////////////////////////////////// */
/* import RecentTransactions from "../../../features/dashboard/components/recentTransactions";
import { useTransactions } from "../../../features/transactions/hooks";
import LoadingScreen from "../../../shared/components/LoadingScreen/LoadingScreen";
import "./trasactionPage.css"


export function TransactionsPage() {
    const { transactions, loading, error } = useTransactions();

    if (loading) return <LoadingScreen message="Cargando transacciones..." />;
    if (error instanceof Error) return <p>{error.message}</p>;

    return (
        <div style={{ padding: "2rem" }}>
            <h1>Transactions</h1>
            <ul>
                <h2>Historial</h2>
                <RecentTransactions transactions={transactions} messageEmpty="Sin transacciones registradas." ></RecentTransactions>
            </ul>
        </div>
    );
}
 */