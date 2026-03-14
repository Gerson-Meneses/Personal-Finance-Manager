import type { Loan } from "../../types"
import {
    getRemaining,
    getProgress
} from "../../utils"
import "./loanCard.css"
import LoanPaymentForm from "../loanPaymentForm"

interface Props {
    loan: Loan
}

export default function LoanCard({ loan }: Props) {

    const remaining = getRemaining(loan)
    const progress = getProgress(loan)

    const typeLabel =
        loan.type === "GIVEN"
            ? "Prestaste"
            : "Te presto"

    return (

        <div
            style={{ borderLeft: loan.type === "GIVEN" ? "5px solid #042893" : "5px solid   #e911cff5" }}
            className="loan-card">
            {loan.lender} - {typeLabel} - Monto: {loan.principalAmount} - Restante: {remaining}
            <div className="loan-progress">
                <div
                    className="loan-progress-bar"
                    style={{
                        width: `${progress}%`
                    }}
                ></div>
            </div>
            {loan.status === "PENDING" ? (
                <LoanPaymentForm
                    loanId={loan.id}
                />
            ) : <span style={{ color: "green" }}>✔ Pagado</span>}

        </div>

    )
}