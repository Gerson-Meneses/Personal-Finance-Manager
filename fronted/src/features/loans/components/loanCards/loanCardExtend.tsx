import type { Loan } from "../../types"
import {
    getTotalPaid,
    getRemaining,
    getProgress
} from "../../utils"
import "./loanCard.css"
import LoanPaymentForm from "../loanPaymentForm"

interface Props {
    loan: Loan
}

export default function LoanCardExtend({ loan }: Props) {

    const totalPaid = getTotalPaid(loan)
    const remaining = getRemaining(loan)
    const progress = getProgress(loan)

    const typeLabel =
        loan.type === "GIVEN"
            ? "Prestaste"
            : "Te prestaron"

    return (

        <div className="loan-card">

            <div className="loan-header">

                <h3>{loan.lender}</h3>

                <span className="loan-type">
                    {typeLabel}
                </span>

            </div>

            <div className="loan-info">

                <p>
                    Monto: {loan.principalAmount}
                </p>

                <p>
                    Pagado: {totalPaid}
                </p>

                <p>
                    Restante: {remaining}
                </p>

            </div>

            <div className="loan-progress">

                <div
                    className="loan-progress-bar"
                    style={{
                        width: `${progress}%`
                    }}
                />

            </div>

            <div className="loan-actions">

                {loan.status === "PENDING" ? (
                    <LoanPaymentForm loanId={loan.id} />
                ) : <span style={{ color: "green" }}>✔ Pagado</span>}
            </div>

        </div>

    )
}