import { useNavigate } from "react-router-dom";
import TransactionItem from "../../transactions/components/TransactionItem";
import type { Transaction } from "../../transactions/types";

interface Props {
  transactions: Transaction[]
  messageEmpty?: string;
}



export default function RecentTransactions({ transactions, messageEmpty }: Props) {
  const navigate = useNavigate()
  return (
    <div className="card recent-activity">
      <div className="card-header-flex">
        <h3>Actividad reciente</h3>
        <button className="btn-text" style={{"cursor": "pointer"}} onClick={() => navigate("/transactions")}>
          Ver todo
        </button>
      </div>

      <div className="tx-list">
        {transactions.length > 0 ? (
          transactions.map((tx) => (
            <TransactionItem key={tx.id} transaction={tx} />
          ))
        ) : (
          <p className="empty-state">{messageEmpty || "Sin transacciones recientes."}</p>
        )}
      </div>
    </div>
  );
}