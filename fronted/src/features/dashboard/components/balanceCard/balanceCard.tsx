import { useNavigate } from "react-router-dom";
import { ArrowRight, Wallet, CreditCard, TrendingDown } from "lucide-react";
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

  return (
    <article className="balance-card dash-hero">
      <div className="hero-top">
        <p className="card-label">Patrimonio neto</p>
        <button className="btn-ghost" onClick={() => navigate("/accounts")}>
          Ver cuentas <ArrowRight size={14} />
        </button>
      </div>

      <h2 className="hero-amount">{formatCurrency(netWorth)}</h2>

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
