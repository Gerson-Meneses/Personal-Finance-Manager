import { useState } from "react";
import type { Loan } from "../../types";
import { getIcon } from "../../../../shared/utils/GetIcon";
import dayjs from "dayjs";
import { formatCurrency } from "../../../../shared/utils/formatCurrency";
import { LoanPaymentsList } from "../LoanPaymentList/LoanPaymentList";
import "./LoanCard.css";
import "dayjs/locale/es";
import { TruncateText } from "../../../../shared/components/TruncateText/TruncateText";
import { HighlightText } from "../../../../shared/components/Highlighttext/Highlighttext";

dayjs.locale("es");

export interface LoanCardProps {
    loan: Loan;
    search?: string;
}

export const LoanCard = ({ loan, search = "" }: LoanCardProps) => {
    const {
        lender,
        type,
        principalAmount,
        status,
        startDate,
        amountPaid,
        amountRemaining,
        percentagePaid,
        transaction,
        termInMonths,
        installmentAmount,
        disbursementAmount,
        tea,
        description: loanDescription,
        payments,
    } = loan;

    const { account, category, name } = transaction ?? {};
    const { name: accountName } = account ?? {};
    const { color } = category ?? {};

    const isPaid = status === "PAID";
    const isGiven = type === "GIVEN";
    const pct = Math.min(100, Math.round(percentagePaid));
    const [expanded, setExpanded] = useState(false);

    const finalDescription = loanDescription || transaction?.description || "";
    const displayName = name || `Préstamo de ${lender}`;
    const dateFormatted = dayjs(startDate).format("dddd D");

    return (
        <div
            className={`loan-card card ${isPaid ? "loan-card--paid" : ""} ${expanded ? "loan-card--expanded" : ""}`}
            style={{ borderLeft: `3px solid ${category?.color}` }}
        >
            <button
                className="loan-card__header"
                onClick={() => setExpanded((p) => !p)}
                aria-expanded={expanded}
            >
                <div className="loan-card__main-content">
                    <div
                        className="loan-card__icon-container"
                        style={{
                            backgroundColor: `${color || "#3b82f6"}15`,
                            color: color || "#3b82f6",
                        }}
                    >
                        {getIcon(category?.icon || "Receipt", { size: 20 })}
                    </div>

                    <div className="loan-card__details-wrapper">
                        <div className="loan-card__top-row">
                            <div className="loan-card__name-group">
                                <HighlightText
                                    text={displayName}
                                    term={search}
                                    className="loan-card__title"
                                />
                                <span className={`loan-card__badge ${isGiven ? "given" : "received"}`}>
                                    {isGiven ? "Presté" : "Recibí"}
                                </span>
                            </div>
                            <span className={`loan-card__amount ${isGiven ? "text-danger" : "text-success"}`}>
                                {isGiven ? "-" : "+"} {formatCurrency(principalAmount)}
                            </span>
                        </div>

                        <div className="loan-card__bottom-row">
                            <div className="loan-card__meta-group">
                                <HighlightText
                                    text={dateFormatted}
                                    term={search}
                                    className="loan-card__date"
                                />
                                <span className="loan-card__divider">•</span>
                                <span
                                    className="loan-card__meta-badge"
                                    style={{ borderColor: color || "#3b82f6", color }}
                                >
                                    {isPaid ? "PAGADO" : "PENDIENTE"} - {formatCurrency(amountRemaining)} restante
                                </span>
                                {accountName && (
                                    <>
                                        <span className="loan-card__divider">•</span>
                                        <HighlightText
                                            text={accountName}
                                            term={search}
                                            className="loan-card__meta-badge loan-card__meta-badge--account"
                                        />
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="loan-card__progress-section">
                            <div className="loan-card__progress-bar">
                                <div
                                    className="loan-card__progress-fill"
                                    style={{ width: `${pct}%`, backgroundColor: color || "#22c55e" }}
                                />
                            </div>
                            <span className="loan-card__progress-text">{pct}% completado</span>
                        </div>
                    </div>
                </div>
            </button>

            <div className="loan-card__collapse-wrapper">
                <div className="loan-card__body">
                    <div className="loan-card__grid">
                        {disbursementAmount && (
                            <div className="loan-card__grid-item">
                                <span className="loan-card__grid-label">Desembolso</span>
                                <span className="loan-card__grid-value">{formatCurrency(disbursementAmount)}</span>
                            </div>
                        )}
                        {installmentAmount && (
                            <div className="loan-card__grid-item">
                                <span className="loan-card__grid-label">Cuota Estimada</span>
                                <span className="loan-card__grid-value">{formatCurrency(installmentAmount)}</span>
                            </div>
                        )}
                        {termInMonths && (
                            <div className="loan-card__grid-item">
                                <span className="loan-card__grid-label">Plazo</span>
                                <span className="loan-card__grid-value">{termInMonths} meses</span>
                            </div>
                        )}
                        {tea !== undefined && (
                            <div className="loan-card__grid-item">
                                <span className="loan-card__grid-label">Tasa (TEA)</span>
                                <span className="loan-card__grid-value">{tea}%</span>
                            </div>
                        )}
                        <div className="loan-card__grid-item">
                            <span className="loan-card__grid-label">Pagado</span>
                            <span className="loan-card__grid-value text-success">{formatCurrency(amountPaid)}</span>
                        </div>
                        <div className="loan-card__grid-item">
                            <span className="loan-card__grid-label">Pendiente</span>
                            <span className="loan-card__grid-value text-danger">{formatCurrency(amountRemaining)}</span>
                        </div>
                    </div>

                    {finalDescription && (
                        <div className="description-section">
                            {search
                                ? <HighlightText text={finalDescription} term={search} className="tx-description text-muted" />
                                : <TruncateText text={finalDescription} maxLength={99} classname="tx-description text-muted" />
                            }
                        </div>
                    )}

                    <LoanPaymentsList loan={loan} payments={payments || []} isGiven={isGiven} />
                </div>
            </div>
        </div>
    );
};