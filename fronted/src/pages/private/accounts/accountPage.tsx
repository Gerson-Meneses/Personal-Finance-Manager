import { useNavigate } from "react-router-dom"
import AccountForm from "../../../features/accounts/components/accountForm/accountForm"
import { useAccounts } from "../../../features/accounts/hooks"
import type { CreateAccountDTO } from "../../../features/accounts/types"
import { useState } from "react"

export const AccountPage = () => {
    const { accounts, createAccount, loading } = useAccounts()
    const [showFormDeb, setShowFormDeb] = useState(false)

    const navigate = useNavigate()

    if (loading) return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", fontSize: "2.5rem", height: "80vh" }} ><span>Cargando...</span></div>

    return (

        <>
            <h1>Accounts</h1>

            <div>
                <h2>Crear cuenta </h2>
                <button onClick={() => setShowFormDeb(!showFormDeb)} >{showFormDeb?"Ocultar Formulario":"Mostrar Formulario"}</button>
                {showFormDeb && <AccountForm onSubmit={(data) => createAccount(data as CreateAccountDTO)} ></AccountForm>}
            </div>


            <div>
                <h2>Mis cuentas</h2>
                <ul>
                    {accounts.data.map((account) => (
                        <li onClick={() => navigate(`/accounts/${account.id}`)} key={account.id}>
                            {account.name} - S/ {account.balance}
                        </li>
                    ))}
                </ul>
            </div>
        </>)
}