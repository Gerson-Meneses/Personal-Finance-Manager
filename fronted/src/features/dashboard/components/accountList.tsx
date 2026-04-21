import { useNavigate } from "react-router-dom";
import AccountCard from "../../accounts/components/accountCard/accountCard";
import type { Account } from "../../accounts/types";

interface Props {
  accounts: Account[];
}

export default function AccountsList({ accounts }: Props) {
  const navigate = useNavigate()
  return (
    <div className="card">
      <div className="card-head">
        <h3 className="card-head-title">Mis Cuentas</h3>
        <button className="btn-ghost" onClick={() => navigate("/accounts")} >Gestionar →</button>
      </div>

      <div className="grid-auto">
        {accounts.map((acc) => (
          <AccountCard key={acc.id} account={acc} onClick={(id) => navigate("/accounts/" + id)} ></AccountCard>
        ))}
      </div>
    </div>
  );
}