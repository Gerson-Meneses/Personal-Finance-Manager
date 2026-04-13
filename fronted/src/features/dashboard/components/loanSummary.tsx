import { useNavigate } from "react-router-dom";

interface Props {
  loans: {
    totalDebt: number;
    totalAmtDue: number;
  };
}

export default function LoansSummary({ loans }: Props) {
  const navigate = useNavigate()
  return (
    <div className="card loans-section">
      <h3>Préstamos</h3>

      <div className="loan-stats">
        <div className="loan-stat-item">
          <p className="summary-label">Me deben</p>
          <strong className="income">
            {new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(loans.totalDebt)}
          </strong>
        </div>

        <div className="loan-divider"></div>

        <div className="loan-stat-item">
          <p className="summary-label">Yo debo</p>
          <strong className="expense">
            {new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(loans.totalAmtDue)}
          </strong>
        </div>
      </div>

      <button className="btn-outline-small" onClick={() => navigate("/loans")} >Ver Prestamos</button>
    </div>
  );
}