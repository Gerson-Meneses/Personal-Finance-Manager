import { useState } from "react"
import type { Account } from "../../accounts/types"
import { useAccounts } from "../../accounts/hooks"
import { useLoans } from "../hooks"

interface Props {
    loanId: string
}

export default function LoanPaymentForm({
    loanId
}: Props) {

    const [amount, setAmount] = useState(0)
    const [date, setDate] = useState(new Date().toISOString().split("T")[0])
    const [accountId, setAccountId] = useState("")
    const { payLoan } = useLoans()

    const { accounts, loading } = useAccounts();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!amount) return
        await payLoan({ id: loanId, amount, date, accountId })
        setAmount(0)
        setDate(new Date().toISOString().split("T")[0])
        setAccountId("")
    }

    if (loading) return <span>Cargando...</span>

    return (

        <form onSubmit={handleSubmit}>

            <input
                name=""
                type="number"
                placeholder="Pago"
                value={amount}
                onChange={(e) =>
                    setAmount(Number(e.target.value))
                }
            />
            {/* Fecha */}
            <input
                className="cursorPointer"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
            />
            {/* Cuenta */}
            <select
                className="cursorPointer"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                required
            >
                <option value="">Selecciona cuenta</option>
                {accounts?.data.map((acc: Account) => (
                    <option key={acc.id} value={acc.id}>
                        {acc.name} - {acc.balance} - {acc.type}
                    </option>
                ))}
            </select>


            <button>
                Registrar pago
            </button>

        </form>
    )
}