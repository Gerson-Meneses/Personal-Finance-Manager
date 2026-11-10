import { useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowRight, Wallet, CreditCard, TrendingDown } from "lucide-react";
import { formatCurrency } from "../../../../shared/utils/formatCurrency";
import "./balanceCard.css"

interface Props {
  balances: {
    debit: number;
    credit: number;
  };
  credit: {
    debt: number;
  };
}

export default function BalanceHero({ balances, credit }: Props) {
  const navigate = useNavigate();
  const netWorth = balances.debit - credit.debt;
  const isNegative = netWorth < 0;

  return (
    <article className={`balance-card dash-hero ${isNegative ? "is-negative" : ""}`}>
      <div className="hero-top">
        <div className="hero-top-label">
          <p className="card-label">Patrimonio neto</p>
          {isNegative && (
            <span className="hero-negative-badge">
              <AlertTriangle size={12} />
              En déficit
            </span>
          )}
        </div>
        <button className="btn-ghost" onClick={() => navigate("/accounts")}>
          Ver cuentas <ArrowRight size={14} />
        </button>
      </div>

      <h2 className={`hero-amount ${isNegative ? "is-negative" : ""}`}>{formatCurrency(netWorth)}</h2>

      {isNegative && (
        <p className="hero-negative-note">
          Tu deuda supera el dinero disponible. Revisa tus cuentas de crédito.
        </p>
      )}

      <div className="hero-stats">
        <div className="hero-stat">
          <Wallet size={15} className="text-success" />
          <div className="hero-stat-text">
            <span>Efectivo y débito</span>
            <strong className="text-success">{formatCurrency(balances.debit)}</strong>
          </div>
        </div>

        <div className="hero-stat">
          <CreditCard size={15} />
          <div className="hero-stat-text">
            <span>Crédito disponible</span>
            <strong>{formatCurrency(balances.credit)}</strong>
          </div>
        </div>

        <div className="hero-stat">
          <TrendingDown size={15} className="text-danger" />
          <div className="hero-stat-text">
            <span>Deuda de crédito</span>
            <strong className="text-danger">{formatCurrency(credit.debt)}</strong>
          </div>
        </div>
      </div>
    </article>
  );
}
