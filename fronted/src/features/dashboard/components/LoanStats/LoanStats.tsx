import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { formatCurrency } from "../../../../shared/utils/formatCurrency";
import type { Loan } from "../../types";
import "./LoanStats.css"

interface Props {
    loans: {
        totalDebt: number;
        totalAmtDue: number;
        given: Loan[]
        received: Loan[]
    };
}

const groupByLender = (list: Loan[]) =>
    Object.entries(
        list.reduce((acc, curr) => {
            acc[curr.lender] = (acc[curr.lender] || 0) + (curr.amountRemaining ?? curr.principalAmount);
            return acc;
        }, {} as Record<string, number>)
    );

export default function LoanStats({ loans }: Props) {
    const [isGivenOpen, setIsGivenOpen] = useState(false);
    const [isReceivedOpen, setIsReceivedOpen] = useState(false);

    const navigate = useNavigate();

    const givenList = groupByLender(loans.given);
    const receivedList = groupByLender(loans.received);

    const headerProps = (open: boolean, toggle: () => void) => ({
        role: "button" as const,
        tabIndex: 0,
        "aria-expanded": open,
        onClick: toggle,
        onKeyDown: (e: React.KeyboardEvent) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                toggle();
            }
        },
    });

    return (
        <div className="card loan-card-container">
            <div className="card-head">
                <h3 className="card-head-title">Préstamos</h3>
                <button onClick={() => navigate("/loans")} className="btn-ghost">
                    Gestionar <ArrowRight size={14} />
                </button>
            </div>

            <div className="default-row loan-container">
                <div className={`loan-stat-item stack-column ${isGivenOpen ? 'is-open' : ''}`}>
                    <div
                        className="header-total givend"
                        {...headerProps(isGivenOpen, () => setIsGivenOpen(v => !v))}
                    >
                        <p className="summary-label">Me deben</p>
                        <strong className="expense">{formatCurrency(loans.totalAmtDue)}</strong>
                        <span className="tooltip-anchor tooltip-left" data-tooltip={isGivenOpen ? "Ocultar detalle" : "Mostrar detalle"}>
                            <span className={`arrow-icon ${isGivenOpen ? 'up' : ''}`}>▼</span>
                        </span>
                    </div>

                    <div
                        className="stack-area"
                        style={{ '--items': givenList.length } as React.CSSProperties}
                    >
                        {givenList.map(([name, amount], index) => (
                            <button
                                type="button"
                                className="detail-card givend"
                                key={name}
                                style={{ '--index': index } as React.CSSProperties}
                                aria-label={`Ver préstamos con ${name}`}
                                onClick={() => navigate("/loans")}
                            >
                                <span className="detail-name">{name}</span>
                                <span className="detail-amount">{formatCurrency(amount)}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="loan-divider"></div>

                <div className={`loan-stat-item stack-column ${isReceivedOpen ? 'is-open' : ''}`}>
                    <div
                        className="header-total debt"
                        {...headerProps(isReceivedOpen, () => setIsReceivedOpen(v => !v))}
                    >
                        <p className="summary-label">Yo debo</p>
                        <strong className="expense">{formatCurrency(loans.totalDebt)}</strong>
                        <span className="tooltip-anchor tooltip-left" data-tooltip={isReceivedOpen ? "Ocultar detalle" : "Mostrar detalle"}>
                            <span className={`arrow-icon ${isReceivedOpen ? 'up' : ''}`}>▼</span>
                        </span>
                    </div>

                    <div
                        className="stack-area"
                        style={{ '--items': receivedList.length } as React.CSSProperties}
                    >
                        {receivedList.map(([name, amount], index) => (
                            <button
                                type="button"
                                className="detail-card debt"
                                key={name}
                                style={{ '--index': index } as React.CSSProperties}
                                aria-label={`Ver préstamos con ${name}`}
                                onClick={() => navigate("/loans")}
                            >
                                <span className="detail-name">{name}</span>
                                <span className="detail-amount">{formatCurrency(amount)}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div >
    );
}
