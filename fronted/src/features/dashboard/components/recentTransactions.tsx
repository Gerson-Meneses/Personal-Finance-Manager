import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import TransactionItem from "../../transactions/components/TransactionItem";
import type { Transaction } from "../../transactions/types";
import type { DashboardWidgetView } from "../../../shared/types/dashboard";

interface Props {
    transactions: Transaction[]
    messageEmpty?: string
    view?: DashboardWidgetView
}

export default function RecentTransactions({ transactions, messageEmpty, view = "full" }: Props) {
    const navigate = useNavigate()
    const limit = view === "minimal" ? 1 : view === "compact" ? 3 : transactions.length
    const visible = transactions.slice(0, limit)

    return (
        <div className={`card recent-transactions view-${view}`}>
            <div className="card-head">
                <h3 className="card-head-title">Actividad reciente</h3>
                <button className="btn-ghost" onClick={() => navigate("/transactions")}>
                    Ver todo <ArrowRight size={14} />
                </button>
            </div>

            {visible.length > 0 ? (
                <div className="tx-list">
                    {visible.map(tx => (
                        <TransactionItem key={tx.id} transaction={tx} />
                    ))}
                </div>
            ) : (
                <div className="empty-state">
                    <p>{messageEmpty ?? "Sin transacciones recientes."}</p>
                </div>
            )}
        </div>
    );
}