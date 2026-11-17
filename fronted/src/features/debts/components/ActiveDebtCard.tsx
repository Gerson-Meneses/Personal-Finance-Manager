import { useState } from "react";
import dayjs from "dayjs";
import {
    CalendarClock,
    ChevronDown,
    HandCoins,
    Pencil,
    ReceiptText,
    ShieldOff,
    Undo2,
} from "lucide-react";
import { formatCurrency } from "../../../shared/utils/formatCurrency";
import type { Loan } from "../../loans/types";
import type { DebtInstallmentItem } from "../../loans/planTypes";
import "./DebtCards.css";

const STATUS_LABEL: Record<string, string> = {
    PENDING: "Pendiente",
    PARTIALLY_PAID: "Parcial",
    OVERDUE: "Vencido",
    PAID: "Pagado",
    CANCELLED: "Cancelado",
};

export interface ActiveDebtCardProps {
    loan: Loan;
    installments?: DebtInstallmentItem[];
    onEdit?: (loan: Loan) => void;
    onPlan?: (loan: Loan) => void;
    onForgive?: (loan: Loan) => void;
    onCancel?: (loan: Loan) => void;
    onOpen?: () => void;
}

export function ActiveDebtCard({
    loan,
    installments = [],
    onEdit,
    onPlan,
    onForgive,
    onCancel,
    onOpen,
}: ActiveDebtCardProps) {
    const [expanded, setExpanded] = useState(false);
    const isGiven = loan.type === "GIVEN";
    const progress = Math.min(100, Math.max(0, Math.round(loan.percentagePaid)));
    const loanInstallments = installments
        .filter((item) => item.loanId === loan.id)
        .sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""));
    const nextInstallment = loanInstallments.find(
        (item) => item.status === "PENDING" || item.status === "PARTIAL" || item.status === "OVERDUE"
    );
    const overdueCount = loanInstallments.filter((item) => item.status === "OVERDUE").length;
    const payments = [...(loan.payments ?? [])]
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 4);
    const description =
        loan.description ||
        loan.transaction?.description ||
        `Préstamo ${isGiven ? "a" : "de"} ${loan.lender}`;

    return (
        <article className={`active-debt card ${isGiven ? "is-given" : "is-received"}`}>
            <header className="active-debt__head">
                <span className={`active-debt__type ${isGiven ? "is-given" : "is-received"}`}>
                    <HandCoins size={13} />
                    {isGiven ? "Me deben" : "Yo debo"}
                </span>
                <span className={`active-debt__status ${loan.status.toLowerCase()}`}>
                    {STATUS_LABEL[loan.status] ?? loan.status}
                </span>
                {overdueCount > 0 && (
                    <span className="active-debt__overdue">{overdueCount} vencida{overdueCount === 1 ? "" : "s"}</span>
                )}
                <strong className={`active-debt__amount amount-font ${isGiven ? "text-success" : "text-danger"}`}>
                    {formatCurrency(loan.amountRemaining)}
                </strong>
            </header>

            <div className="active-debt__body">
                <div className="active-debt__title">
                    <strong>{description}</strong>
                    <small>
                        Inicio {dayjs(loan.startDate).format("D MMM YYYY")}
                        {loan.contact?.name ? ` · ${loan.contact.name}` : ""}
                    </small>
                </div>

                <div className="active-debt__progress">
                    <span style={{ width: `${progress}%` }} />
                </div>

                <div className="active-debt__stats">
                    <span>Pagado <strong>{formatCurrency(loan.amountPaid)}</strong></span>
                    <span>Pendiente <strong>{formatCurrency(loan.amountRemaining)}</strong></span>
                    <span>{progress}% completado</span>
                </div>

                <div className="active-debt__meta">
                    {nextInstallment?.dueDate ? (
                        <span className={nextInstallment.status === "OVERDUE" ? "is-danger" : ""}>
                            <CalendarClock size={13} />
                            Próxima cuota {dayjs(nextInstallment.dueDate).format("D MMM")} ·{" "}
                            {formatCurrency(nextInstallment.remaining)}
                        </span>
                    ) : (
                        <span className="is-muted">
                            <CalendarClock size={13} />
                            Sin cuota programada
                        </span>
                    )}
                    {loan.paymentCount > 0 && (
                        <button
                            type="button"
                            className="active-debt__toggle"
                            aria-expanded={expanded}
                            onClick={() => setExpanded((value) => !value)}
                        >
                            <ReceiptText size={13} />
                            {loan.paymentCount} pago{loan.paymentCount === 1 ? "" : "s"}
                            <ChevronDown size={13} className={expanded ? "is-open" : ""} />
                        </button>
                    )}
                </div>
            </div>

            {expanded && (
                <div className="active-debt__payments">
                    {payments.length === 0 ? (
                        <p className="active-debt__empty">Sin pagos registrados.</p>
                    ) : (
                        payments.map((payment) => (
                            <div key={payment.id} className="active-debt__payment">
                                <span>{dayjs(payment.date).format("D MMM YYYY")}</span>
                                <small>{payment.description ?? "Abono"}</small>
                                <strong>{formatCurrency(payment.amount)}</strong>
                            </div>
                        ))
                    )}
                </div>
            )}

            {onEdit || onPlan || onForgive || onCancel || onOpen ? (
                <footer className="active-debt__actions">
                    {onOpen && (
                        <button type="button" className="btn-secondary" onClick={onOpen}>
                            <ReceiptText size={14} /> Ver persona
                        </button>
                    )}
                    {onPlan && (
                        <button type="button" className="btn-secondary" onClick={() => onPlan(loan)}>
                            <CalendarClock size={14} /> Planificar
                        </button>
                    )}
                    {onEdit && (
                        <button type="button" className="btn-secondary" onClick={() => onEdit(loan)}>
                            <Pencil size={14} /> Editar
                        </button>
                    )}
                    {onForgive && (
                        <button type="button" className="btn-ghost" onClick={() => onForgive(loan)}>
                            <Undo2 size={14} /> Condonar
                        </button>
                    )}
                    {onCancel && (
                        <button type="button" className="btn-ghost" onClick={() => onCancel(loan)}>
                            <ShieldOff size={14} /> Cancelar
                        </button>
                    )}
                </footer>
            ) : null}
        </article>
    );
}
