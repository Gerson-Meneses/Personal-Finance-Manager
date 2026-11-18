import { useNavigate } from "react-router-dom";
import { ArrowRight, Wallet } from "lucide-react";
import AccountCard from "../../accounts/components/accountCard/accountCard";
import type { Account } from "../../accounts/types";
import type { DashboardWidgetView } from "../../../shared/types/dashboard";
import { formatCurrency } from "../../../shared/utils/formatCurrency";

interface Props {
  accounts: Account[];
  view?: DashboardWidgetView;
}

export default function AccountsList({ accounts, view = "full" }: Props) {
  const navigate = useNavigate();
  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);

  if (view === "minimal") {
    return (
      <div className="card accounts-list-card view-minimal" data-tour="accounts">
        <div className="card-head">
          <h3 className="card-head-title">Mis Cuentas</h3>
          <button className="btn-ghost" onClick={() => navigate("/accounts")}>
            Gestionar <ArrowRight size={14} />
          </button>
        </div>

        <div className="accounts-minimal">
          <span className="accounts-minimal__icon">
            <Wallet size={16} />
          </span>
          <div>
            <span>
              {accounts.length} cuenta{accounts.length === 1 ? "" : "s"}
            </span>
            <strong className="amount-font">{formatCurrency(totalBalance)}</strong>
          </div>
        </div>
      </div>
    );
  }

  if (view === "compact") {
    return (
      <div className="card accounts-list-card view-compact" data-tour="accounts">
        <div className="card-head">
          <h3 className="card-head-title">Mis Cuentas</h3>
          <button className="btn-ghost" onClick={() => navigate("/accounts")}>
            Gestionar <ArrowRight size={14} />
          </button>
        </div>

        {accounts.length === 0 ? (
          <div className="empty-state">
            <p className="text-muted">Sin cuentas registradas.</p>
          </div>
        ) : (
          <ul className="accounts-compact-list">
            {accounts.slice(0, 6).map((account) => (
              <li key={account.id}>
                <button
                  type="button"
                  onClick={() => navigate(`/accounts/${account.id}`)}
                >
                  <span className="accounts-compact-list__dot" style={{ background: account.color }} />
                  <span className="accounts-compact-list__name">{account.name}</span>
                  <strong
                    className={`amount-font ${account.balance < 0 ? "text-danger" : "text-success"}`}
                  >
                    {formatCurrency(account.balance)}
                  </strong>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <div className="card accounts-list-card view-full" data-tour="accounts">
      <div className="card-head">
        <h3 className="card-head-title">Mis Cuentas</h3>
        <button className="btn-ghost" onClick={() => navigate("/accounts")}>
          Gestionar <ArrowRight size={14} />
        </button>
      </div>

      <div className="grid-auto">
        {accounts.map((acc) => (
          <AccountCard key={acc.id} account={acc} onClick={(id) => navigate("/accounts/" + id)} ></AccountCard>
        ))}
      </div>

      {accounts.length > 0 && (
        <p className="dash-hint">Toca una cuenta para ver sus movimientos</p>
      )}
    </div>
  );
}
