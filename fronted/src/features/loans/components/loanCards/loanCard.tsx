import type { Loan } from "../../types"
import { getRemaining, getProgress, getTotalPaid } from "../../utils"
import LoanPaymentForm from "../loanPaymentForm"
import "./loanCard.css"
import { formatCurrency } from "../../../../shared/utils/formatCurrency"

interface Props {
    loan: Loan
    extended?: boolean   // true → muestra el detalle completo
}

export default function LoanCard({ loan, extended = false }: Props) {
    const remaining = getRemaining(loan)
    const progress = getProgress(loan)
    const totalPaid = getTotalPaid(loan)
    const isGiven = loan.type === "GIVEN"
    const isPending = loan.status === "PENDING"

    return (
        <div className={`loan-card-v2 ${isGiven ? "type-given" : "type-received"}`}>

            {/* Header */}
            <div className="lc-header">
                <div className="lc-lender">
                    <div className="lc-avatar">
                        {loan.lender.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <span className="lc-name">{loan.lender}</span>
                        <span className="lc-direction">
                            {isGiven ? "Prestaste" : "Te prestaron"}
                        </span>
                    </div>
                </div>
                <span className={`lc-status ${loan.status.toLowerCase()}`}>
                    {isPending ? "Pendiente" : "Pagado"}
                </span>
            </div>

            {/* Monto principal */}
            <div className="lc-amount-section">
                <span className="lc-amount-label">Monto original</span>
                <span className="lc-amount">{formatCurrency(loan.principalAmount)}</span>
            </div>

            {/* Detalle extendido */}
            {extended && (
                <div className="lc-detail-row">
                    <div className="lc-detail-item">
                        <span className="lc-detail-label">Pagado</span>
                        <span className="lc-detail-value text-success">{formatCurrency(totalPaid)}</span>
                    </div>
                    <div className="lc-detail-item">
                        <span className="lc-detail-label">Restante</span>
                        <span className="lc-detail-value text-danger">{formatCurrency(remaining)}</span>
                    </div>
                </div>
            )}

            {/* Barra de progreso */}
            <div className="lc-progress">
                <div className="lc-progress-meta">
                    <span>Progreso de pago</span>
                    <span>{progress}%</span>
                </div>
                <div className="lc-progress-track">
                    <div
                        className={`lc-progress-fill ${progress > 90 ? "near-done" : ""}`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
                {!extended && (
                    <small className="text-muted">Restante: <strong className="text-danger">{formatCurrency(remaining)}</strong></small>
                )}
            </div>

            {/* Footer */}
            <div className="lc-footer">
                {isPending ? (
                    <LoanPaymentForm loan={loan} />
                ) : (
                    <div className="lc-paid-badge">✓ Liquidado</div>
                )}
            </div>
        </div>
    )
}