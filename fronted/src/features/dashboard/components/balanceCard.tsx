import { useNavigate } from "react-router-dom";
// Asume que este icono es de una librería como lucide-react o react-icons
import { CreditCard, Banknote, ArrowRight } from "lucide-react"; 

interface Props {
  balances: {
    debit: number;
    credit: number;
  };
  credit: {
    debt: number;
  };
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(amount);
};

export default function BalanceCards({ balances }: Props) {
  const navigate = useNavigate();

  const cards = [
    {
      title: "Saldo débito",
      amount: balances.debit,
      className: "card-debit",
      path: "/accounts",
      icon: Banknote,
    },
    {
      title: "Saldo crédito",
      amount: balances.credit,
      className: "card-credit",
      path: "/accounts",
      icon: CreditCard,
    },
  ];

  return (
    <section className="balance-cards-container">
      {cards.map((card, index) => {
        const Icon = card.icon; // Obtenemos el icono
        return (
          <article
            key={index}
            className={`balance-card ${card.className}`}
            onClick={() => navigate(card.path)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && navigate(card.path)}
          >
            <div className="card-header">
              <Icon className="card-icon" size={24} />
              <p className="card-label">{card.title}</p>
            </div>
            
            <h2 className="card-amount">{formatCurrency(card.amount)}</h2>
            
            {/* El enlace es ahora sutil y semántico */}
            <a href={card.path} className="card-details" onClick={(e) => e.preventDefault()}>
              Ver detalles <ArrowRight size={16} />
            </a>
          </article>
        );
      })}
    </section>
  );
}