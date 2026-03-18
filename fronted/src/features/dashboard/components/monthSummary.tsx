import { formatCurrency } from "../../../shared/utils/formatCurrency";
import "./style.css"

interface Props {
  month: {
    income: number;
    expense: number;
    net: number;
  };
}
export default function MonthSummary({ month }: Props) {
  // Determinamos el color del balance neto
  const netClassName = month.net >= 0 ? "income" : "expense";

  const summaryItems = [
    { label: "Ingresos", value: month.income, className: "income" },
    { label: "Gastos", value: month.expense, className: "expense" },
    { label: "Balance", value: month.net, className: netClassName },
  ];

  return (
    <section className="month-summary-container">
      {summaryItems.map((item, index) => (
        <div key={index} className="summary-item">
          <p className="summary-label">{item.label}</p>
          <strong className={`summary-value ${item.className}`}>
            {formatCurrency(item.value)}
          </strong>
        </div>
      ))}
    </section>
  );
}