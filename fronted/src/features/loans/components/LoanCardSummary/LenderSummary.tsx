import { useNavigate } from "react-router-dom"
import { formatCurrency } from "../../../../shared/utils/formatCurrency"
import type { LoanSummaryGrouped } from "../../types"
import "./LenderSummary.css"

interface LenderSummaryProps {
    summaryLender: LoanSummaryGrouped
    details?: boolean
}
export const LenderSummary = ({
    summaryLender,
    details = true
}: LenderSummaryProps) => {
    const { lender, byType } = summaryLender

    const navigate = useNavigate()

    const received = byType.RECEIVED
    const given = byType.GIVEN

    return (
        <div className="card flex flex-col gap-1">

            <div className="lender-header">
                <h3> • {lender} •</h3>
            </div>

            <div className="loan-columns">

                {received && (
                    <LoanColumn
                        title="Me prestó"
                        detail={received}
                        type="received"
                    />
                )}

                {given && (
                    <LoanColumn
                        title="Le Presté"
                        detail={given}
                        type="given"
                    />
                )}

            </div>

            {details && <button onClick={() => navigate(`${lender}`)} className="btn-ghost">Ver detalles →</button>}
        </div>
    )
}

function LoanColumn({
    title,
    detail,
    type
}: any) {
    return (
        <div className={`loan-column ${type}`}>

            <h4
                className={`${type} tittle`}>{title}:
            </h4>

            <div className="loan-data">
                <span>Total: </span>
                <p>{formatCurrency(detail.totalAmount)}</p>
            </div>

            <div className="loan-data">
                <span>Pagado: </span>
                <p>{formatCurrency(detail.totalPaid)}</p>
            </div>

            <div className="loan-data">
                <span>Pendiente: </span>
                <p>{formatCurrency(detail.totalRemaining)}</p>
            </div>

            <div className="progress">
                <div
                    className={`progress-fill ${type}`}
                    style={{
                        width: `${detail.progress ?? 0}%`
                    }}
                />
            </div>

        </div>
    )
}