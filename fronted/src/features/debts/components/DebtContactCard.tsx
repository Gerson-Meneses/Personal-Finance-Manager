import { Link } from "react-router-dom";
import dayjs from "dayjs";
import { AlertTriangle, ArrowRight, CalendarClock, HandCoins, Users } from "lucide-react";
import { formatCurrency } from "../../../shared/utils/formatCurrency";
import type { ContactDebtRow } from "../types";
import "./DebtCards.css";

const getInitials = (name: string) =>
    name
        .split(" ")
        .filter(Boolean)
        .map((part) => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();

export function DebtContactCard({ row }: { row: ContactDebtRow }) {
    const progress =
        row.totalAmount > 0
            ? Math.min(100, Math.max(0, Math.round((row.totalPaid / row.totalAmount) * 100)))
            : 0;
    const hasDebt = row.loanCount > 0;
    const href = row.contactId ? `/debts/${row.contactId}` : undefined;

    const content = (
        <>
            <header className="debt-contact__head">
                <span className={`debt-contact__avatar ${row.overdueCount > 0 ? "has-risk" : ""}`}>
                    {getInitials(row.name)}
                </span>
                <div className="debt-contact__identity">
                    <strong>{row.name}</strong>
                    <small>
                        {row.loanCount} préstamo{row.loanCount === 1 ? "" : "s"}
                        {row.archived ? " · archivado" : ""}
                    </small>
                </div>
                <div className={`debt-contact__net ${row.net >= 0 ? "is-positive" : "is-negative"}`}>
                    <small>{row.net >= 0 ? "A favor" : "Por pagar"}</small>
                    <strong>{formatCurrency(Math.abs(row.net))}</strong>
                </div>
            </header>

            {row.notes && <p className="debt-contact__notes">{row.notes}</p>}

            <div className="debt-contact__split">
                <span>
                    Me deben
                    <strong className="text-success">{formatCurrency(row.given)}</strong>
                </span>
                <span>
                    Yo debo
                    <strong className="text-danger">{formatCurrency(row.received)}</strong>
                </span>
            </div>

            <div className="debt-contact__progress" aria-hidden="true">
                <span style={{ width: `${progress}%` }} />
            </div>

            <div className="debt-contact__meta">
                <span>
                    <HandCoins size={13} />
                    {progress}% pagado
                </span>
                {row.nextDueDate ? (
                    <span>
                        <CalendarClock size={13} />
                        Próximo {dayjs(row.nextDueDate).format("D MMM")}
                    </span>
                ) : (
                    <span className="is-muted">Sin cuotas próximas</span>
                )}
                {row.overdueCount > 0 && (
                    <span className="is-danger">
                        <AlertTriangle size={13} />
                        {row.overdueCount} vencida{row.overdueCount === 1 ? "" : "s"}
                    </span>
                )}
            </div>

            {href ? (
                <footer className="debt-contact__footer">
                    <span>{hasDebt ? "Ver deudas activas" : "Ver ficha del contacto"}</span>
                    <ArrowRight size={14} />
                </footer>
            ) : (
                <footer className="debt-contact__footer is-muted">
                    <Users size={14} />
                    Sin contacto vinculado
                </footer>
            )}
        </>
    );

    if (!href) {
        return <article className="debt-contact card is-static">{content}</article>;
    }

    return (
        <Link className={`debt-contact card ${hasDebt ? "" : "is-empty"}`} to={href}>
            {content}
        </Link>
    );
}
