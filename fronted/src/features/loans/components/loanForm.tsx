import { useState } from "react"
import type { Loan, LoanType } from "../types"
import { useAccounts } from "../../accounts/hooks"
import type { Account } from "../../accounts/types"

interface Props {
    onSubmit: (data: {
        lender: string
        principalAmount: number
        type: LoanType
        startDate: string
        accountId: string
    }) => Promise<Loan>
}

export default function LoanForm({ onSubmit }: Props) {

    const [lender, setLender] = useState("")
    const [principalAmount, setPrincipalAmount] = useState(0)
    const [type, setType] = useState<LoanType>("GIVEN")
    const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0])
    const [accountId, setAccountId] = useState("")

    const { data: dataAccounts } = useAccounts();

    const handleSubmit = async (e: React.FormEvent) => {

        e.preventDefault()

        if (!lender || !principalAmount) return

        await onSubmit({
            lender,
            principalAmount,
            type,
            startDate,
            accountId
        })

        setLender("")
        setPrincipalAmount(0)
    }

    return (

        <form onSubmit={handleSubmit}>

            <input
                placeholder="Persona"
                value={lender}
                onChange={(e) =>
                    setLender(e.target.value)
                }
            />

            <input
                type="number"
                placeholder="Monto"
                value={principalAmount}
                onChange={(e) =>
                    setPrincipalAmount(Number(e.target.value))
                }
            />

            <select
                value={type}
                onChange={(e) =>
                    setType(e.target.value as LoanType)
                }
            >

                <option value="GIVEN">
                    Presté dinero
                </option>

                <option value="RECEIVED">
                    Me prestaron
                </option>

            </select>

            {/* Fecha */}
            <input
                className="cursorPointer"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
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
                Crear préstamo
            </button>

        </form>
    )
}