import "./accountCard.css"
import type { Account, AccountType } from "../../types";
import { formatCurrency } from "../../../../shared/utils/formatCurrency";
import { getIcon } from "../../../../shared/utils/GetIcon";
import { getProgressColor } from "../../../../shared/utils/generateColors";
import { getCreditDebt, getCreditUsage } from "../../utils";
import { Nfc } from "lucide-react";

interface Props {
  account: Account;
  onClick?: (id: string) => void;
}

const TYPE_LABELS: Record<AccountType, string> = {
  CREDIT: "Crédito",
  DEBIT: "Débito",
  CASH: "Efectivo",
};

export default function AccountCard({ account, onClick }: Props) {
  const {
    id, name, balance, type, color, icon,
    creditLimit, overdraft, billingCloseDay, paymentDueDay
  } = account;
  const isCredit = type === "CREDIT";
  const usedPercentage = getCreditUsage(account);

  return (
    <div
      className="account-card"
      style={{ "--card-color": color } as React.CSSProperties}
      onClick={() => onClick?.(id)}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (!onClick) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick(id);
        }
      }}
    >
      <div className="acc-card-content">
        {/* ── Fila superior: chip + contactless + tipo ── */}
        <div className="acc-top">
          <span className="acc-chip" aria-hidden="true" />
          <span className="acc-nfc tooltip-anchor tooltip-right" data-tooltip="Pagos sin contacto">
            <Nfc size={17} aria-hidden="true" />
          </span>
          <span className="acc-type">{TYPE_LABELS[type]}</span>
        </div>

        {/* ── Cuerpo: identidad + saldo ── */}
        <div className="acc-body">
          <div className="acc-identity tooltip-top" data-tooltip={name}>
            <span className="acc-icon" style={{ background: `${color}20` }}>
              {icon && getIcon(icon, { color, defaultIcon: "wallet" })}
            </span>
            <span className="acc-name">{name}</span>
          </div>
          <span className="acc-balance">{formatCurrency(balance)}</span>
          {isCredit && (
            <span className="acc-sub">
              Usado: {formatCurrency(getCreditDebt(account))}
              {creditLimit ? ` de ${formatCurrency(creditLimit)}` : ""}
              {(overdraft ?? 0) > 0 && (
                <span className="acc-overdraft">+{overdraft}%</span>
              )}
            </span>
          )}
        </div>

        {/* ── Fila inferior: número enmascarado + fechas ── */}
        <div className="acc-bottom">
          <span className="acc-number tooltip-top tooltip-wide" data-tooltip={id}>
            •••• {id.slice(-4).toUpperCase()}
          </span>
          {isCredit && (billingCloseDay || paymentDueDay) && (
            <span className="tooltip-anchor tooltip-left"
              data-tooltip={[
                billingCloseDay && `Cierra día ${billingCloseDay}`,
                paymentDueDay && `Paga día ${paymentDueDay}`,
              ].filter(Boolean).join(" · ")}
            >
              <span className="acc-meta">
                {billingCloseDay && `Cierra día ${billingCloseDay}`}
                {billingCloseDay && paymentDueDay && " · "}
                {paymentDueDay && `Paga día ${paymentDueDay}`}
              </span>
            </span>
          )}
        </div>
      </div>

      {/* ── Barra de uso del límite (solo crédito) ── */}
      {isCredit && (
        <div className="acc-usage" aria-hidden="true">
          <div
            className="acc-usage-fill"
            style={{
              width: `${usedPercentage}%`,
              background: getProgressColor(usedPercentage),
            }}
          />
        </div>
      )}
    </div>
  );
}
