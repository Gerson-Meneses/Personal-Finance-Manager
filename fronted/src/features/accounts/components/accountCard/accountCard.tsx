import "./accountCard.css"
import type { Account } from "../../types";
import { formatCurrency } from "../../../../shared/utils/formatCurrency";
import { getIcon } from "../../../../shared/utils/GetIcon";

interface Props {
  account: Account;
  onClick?: (id: string) => void;
}

export default function AccountCard({ account, onClick }: Props) {
  const {
    id, name, balance, type, color, icon,
    creditLimit, overdraft
  } = account;
  const isCredit = type === "CREDIT";

  // Cálculo de porcentaje para tarjetas de crédito
  // Si es crédito, el "balance" suele ser la deuda.
  const usedPercentage = isCredit && creditLimit
    ? Math.min(Math.round(((creditLimit! * ((overdraft || 0) / 100 + 1) - balance) / creditLimit) * 100), 100)
    : 0;

  return (
    <div
      className="account-card-wrapper"
      onClick={() => onClick?.(id)}
      style={{
        '--card-color': color + "aa",
        cursor: onClick ? 'pointer' : 'default'
      } as React.CSSProperties}
    >
      <div className="card-glass-effect"></div>

      {/* Encabezado: Icono y Tipo */}
      <div className="card-header">
        <div className="icon-badge">
          {icon && getIcon(icon, { color, defaultIcon: "wallet" })}
        </div>
        <div className="rigth">

          <span className="account-type-label">
            {isCredit ? "Crédito" : "Débito"}
          </span>
        </div>
      </div>

      {/* Cuerpo: Nombre y Saldo */}
      <div className="card-body">
        <h3 className="account-name">{name}</h3>
        <div className="balance-display">
          <span className="amount">{formatCurrency(balance)}</span>
        </div>
        {isCredit && <div style={{ display: "block", width: "100%" }} > Usado: {formatCurrency((account.creditLimit! * ((account.overdraft || 0) / 100 + 1) - account.balance))} </div>}
      </div>

      {/* Pie: Barra de progreso (Solo Crédito) */}
      {isCredit && (
        <div className="card-footer">
          <div className="progress-info">
            <span>Uso del límite</span>
            <span>{usedPercentage}%</span>
          </div>
          <div className="progress-bar-bg">
            <div
              className={`progress-bar-fill ${usedPercentage > 90 ? 'danger' : ''}`}
              style={{ width: `${usedPercentage}%` }}
            ></div>
          </div>
          <div className="limit-details">
            <span>Límite: S/ {creditLimit?.toLocaleString()}</span>
            {overdraft && overdraft > 0 && <span className="text-warning">+{overdraft}% sob.</span>}
          </div>
        </div>
      )}

      {!isCredit && (
        <div className="card-footer debit-footer">
          <div className="status-badge">
            <div className="dot"></div> Activa
          </div>

        </div>
      )}
    </div>
  );
}