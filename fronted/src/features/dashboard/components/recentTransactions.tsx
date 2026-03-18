import type { Transaction } from "../../../features/dashboard/types"

interface Props {
  transactions: Transaction[]
}

// Sub-componente interno para mantener el código limpio
const TransactionItem = ({ tx }: { tx: Transaction }) => {
  const isExpense = tx.type === "EXPENSE";
  
  // Formateador de moneda
  const amountFormatted = new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
  }).format(tx.amount);

  return (
    <div className="tx-row">
      <div className="tx-info">
        <p className="tx-name">{tx.name}</p>
        <div className="tx-details">
          <span className="tx-category">{tx.category.name}</span>
          {/* Suponiendo que tx.date existe, si no, puedes omitirlo */}
          <span className="tx-date">• {new Date().toLocaleDateString('es-PE')}</span>
        </div>
      </div>
      <strong className={isExpense ? "expense" : "income"}>
        {isExpense ? "- " : "+ "}
        {amountFormatted}
      </strong>
    </div>
  );
};

export default function RecentTransactions({ transactions }: Props) {
  return (
    <div className="card recent-activity">
      <div className="card-header-flex">
        <h3>Actividad reciente</h3>
        <button className="btn-text">Ver todo</button>
      </div>

      <div className="tx-list">
        {transactions.length > 0 ? (
          transactions.map((tx) => (
            <TransactionItem key={tx.id} tx={tx} />
          ))
        ) : (
          <p className="empty-state">No hay transacciones recientes.</p>
        )}
      </div>
    </div>
  );
}