import { useState } from "react"
import type { Account } from "../../accounts/types"
import { useAccounts } from "../../accounts/hooks"
import type { LoanPayment } from "../types"

interface Props {
    onSubmit: (amount: number, date: string, accountId: string) => Promise<LoanPayment>
}

export default function LoanPaymentForm({ onSubmit }: Props) {
    const [amount, setAmount] = useState(0)
    const [date, setDate] = useState(new Date().toISOString().split("T")[0])
    const [accountId, setAccountId] = useState("")

    const { data: dataAccounts } = useAccounts();

    const handleSubmit = async (
        e: React.FormEvent
    ) => {

        e.preventDefault()

        if (!amount) return

        await onSubmit(amount, date, accountId)

        setAmount(0)
    }

    return (

        <form onSubmit={handleSubmit}>

            <input
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
                {dataAccounts?.data.map((acc: Account) => (
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