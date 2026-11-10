import { useNavigate } from "react-router-dom"
import { formatCurrency } from "../../../../shared/utils/formatCurrency"
import type { LoanSummaryDetail, LoanSummaryGrouped } from "../../types"
import "./LenderSummary.css"

interface LenderSummaryProps {
    summaryLender: LoanSummaryGrouped
    details?: boolean
}

const getInitials = (name: string) =>
    name
        .split(" ")
        .filter(Boolean)
        .map((part) => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()

export const LenderSummary = ({
    summaryLender,
    details = true
}: LenderSummaryProps) => {
    const { lender, byType, total } = summaryLender
    const navigate = useNavigate()

    const received = byType.RECEIVED
    const given = byType.GIVEN
    const net = (given?.totalRemaining ?? 0) - (received?.totalRemaining ?? 0)
    const progress = Math.min(100, Math.max(0, Math.round(total.progress ?? 0)))

    return (
        <article className={`lender-card card ${details ? "lender-card--link" : ""}`}>
            <header className="lender-card__header">
                <span className="lender-card__avatar" aria-hidden="true">
                    {getInitials(lender)}
                </span>

                <div className="lender-card__identity">
                    <h3>{lender}</h3>
                    <span>
                        {total.loanCount} préstamo{total.loanCount !== 1 ? "s" : ""} activo{total.loanCount !== 1 ? "s" : ""}
                    </span>
                </div>

                <div className={`lender-card__net ${net >= 0 ? "is-positive" : "is-negative"}`}>
                    <small>{net >= 0 ? "A favor" : "Por pagar"}</small>
                    <strong>{formatCurrency(Math.abs(net))}</strong>
                </div>
            </header>

            <div className="lender-card__types">
                {received && (
                    <LoanColumn
                        title="Yo debo"
                        detail={received}
                        type="received"
                    />
                )}

                {given && (
                    <LoanColumn
                        title="Me deben"
                        detail={given}
                        type="given"
                    />
                )}
            </div>

            <div className="lender-card__progress" aria-hidden="true">
                <span style={{ width: `${progress}%` }} />
            </div>

            <footer className="lender-card__footer">
                <span>
                    Pagado {formatCurrency(total.totalPaid)} de {formatCurrency(total.totalAmount)}
                </span>
                {details && (
                    <button
                        type="button"
                        className="lender-card__action"
                        onClick={() => navigate(`${lender}`)}
                    >
                        Ver detalle
                        <span aria-hidden="true">→</span>
                    </button>
                )}
            </footer>
        </article>
    )
}

interface LoanColumnProps {
    title: string
    detail: LoanSummaryDetail
    type: "received" | "given"
}

function LoanColumn({ title, detail, type }: LoanColumnProps) {
    const progress = Math.min(100, Math.max(0, Math.round(detail.progress ?? 0)))

    return (
        <div className={`lender-type lender-type--${type}`}>
            <div className="lender-type__head">
                <span>{title}</span>
                <strong className="amount-font">{formatCurrency(detail.totalRemaining)}</strong>
            </div>

            <div className="lender-type__bar">
                <span style={{ width: `${progress}%` }} />
            </div>

            <span className="lender-type__meta">
                {detail.loanCount} préstamo{detail.loanCount !== 1 ? "s" : ""}
                {" · "}
                {progress}% pagado
            </span>
        </div>
    )
}
