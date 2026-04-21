import { useNavigate } from "react-router-dom";
import TransactionItem from "../../transactions/components/TransactionItem";
import type { Transaction } from "../../transactions/types";

interface Props {
    transactions: Transaction[]
    messageEmpty?: string
}

export default function RecentTransactions({ transactions, messageEmpty }: Props) {
    const navigate = useNavigate()
    return (
        <div className="card">
            <div className="card-head" style={{ marginBottom: 14 }}>
                <h3 className="card-head-title">Actividad reciente</h3>
                <button className="btn-ghost" onClick={() => navigate("/transactions")}>
                    Ver todo
                </button>
            </div>

            {transactions.length > 0 ? (
                <div className="tx-list">
                    {transactions.map(tx => (
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