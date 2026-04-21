import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { formatCurrency } from "../../../../shared/utils/formatCurrency";
import "./balanceCard.css"
import { getIcon } from "../../../../shared/utils/GetIcon";

interface Props {
  balances: {
    debit: number;
    credit: number;
  };
  credit: {
    debt: number;
  };
}


export default function BalanceCards({ balances }: Props) {
  const navigate = useNavigate();

  const cards = [
    {
      title: "Saldo débito",
      amount: balances.debit,
      className: "card-debit",
      path: "/accounts",
      icon: "Banknote",
    },
    {
      title: "Saldo crédito",
      amount: balances.credit,
      className: "card-credit",
      path: "/accounts",
      icon: "CreditCard",
    },
  ];

  return (
    <section className="default-row">
      {cards.map((card, index) => {
        return (
          <article
            key={index}
            className={`balance-card ${card.className}`}

            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && navigate(card.path)}
          >
            <div className="card-head">
              {getIcon(card.icon, { size: 24 })}
              <p className="card-label">{card.title}</p>
            </div>

            <h2 className="card-amount">{formatCurrency(card.amount)}</h2>

            <a href={card.path} className="card-details" onClick={(e) => { e.preventDefault(), e.stopPropagation(), navigate(card.path) }}>
              Ver detalles <ArrowRight size={16} />
            </a>
          </article>
        );
      })}
    </section>
  );
}