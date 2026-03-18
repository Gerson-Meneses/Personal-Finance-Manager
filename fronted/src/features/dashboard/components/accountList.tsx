import type { Account } from "../../../features/dashboard/types";

interface Props {
  accounts: Account[];
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
  }).format(amount);
};

export default function AccountsList({ accounts }: Props) {
  return (
    <div className="card accounts-section">
      <div className="card-header-flex">
        <h3>Mis Cuentas</h3>
        <button className="btn-text">Gestionar</button>
      </div>

      <div className="accounts-stack">
        {accounts.map((acc) => (
          <div key={acc.id} className="account-row-v2">
            <div className="account-main-info">
              <span className="account-icon-circle" style={{background: acc.color}} >
                {acc.name.charAt(0).toUpperCase()}
              </span>
              <div>
                <p className="account-name">{acc.name}</p>
                <small className="account-type">Cuenta Corriente</small>
              </div>
            </div>
            <strong className="account-balance">
              {formatCurrency(acc.balance)}
            </strong>
          </div>
        ))}
      </div>
    </div>
  );
}