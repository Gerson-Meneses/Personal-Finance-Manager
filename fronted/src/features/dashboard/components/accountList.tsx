import { useNavigate } from "react-router-dom";
import AccountCard from "../../accounts/components/accountCard/accountCard";
import type { Account } from "../../accounts/types";

interface Props {
  accounts: Account[];
}

export default function AccountsList({ accounts }: Props) {
  const navigate = useNavigate()
  return (
    <div className="card accounts-section">
      <div className="card-header-flex">
        <h3>Mis Cuentas</h3>

        <button className="btn-text" onClick={() => navigate("/accounts")} >Gestionar</button>
      </div>

      <div className="accounts-stack">
        {accounts.map((acc) => (
          <AccountCard key={acc.id} account={acc} ></AccountCard>
        ))}
      </div>
    </div>
  );
}