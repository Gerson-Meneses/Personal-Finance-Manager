import { useParams } from "react-router-dom";
import { useAccounts } from "../../../features/accounts/hooks";
import { useTransactions } from "../../../features/transactions/hooks";

function AccountDetail() {

    const { id } = useParams();
    const { account, loading } = useAccounts(id);
    const { data } = useTransactions({ accountId: id })

    if (loading) return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", fontSize: "2.5rem", height: "80vh" }} ><span>Cargando...</span></div>

    return (
        <div style={{ color: account.color, margin: "10vh", padding: "2.5vh" }} >
            {account.name} {account.type}
            <span> Saldo disponible: {account.balance} </span>
            {account.type === "CREDIT" && <span> Deuda Total: {(account.creditLimit! * ((account.overdraft || 0) / 100 + 1) - account.balance)} </span>}

            <button>
                {account.type === "CREDIT" ? "Pagar Deuda" : "Transferir dinero."}
                {/* Componente de transferncias, en formato de modal */}
            </button>
            <ul>Ultimos movimientos</ul>
            {data ? data?.data?.map(tx => {
                return <li key={tx.id} style={{background: tx.type === "EXPENSE" ? "#f00" : "#0f0" }} > {tx.type} - {tx.name} - {tx.amount} - {tx.date} </li>
            }) : <>Sin movimientos registrados</>}
        </div>
    );
}

export default AccountDetail;