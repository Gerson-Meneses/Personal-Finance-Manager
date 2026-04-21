import { useNavigate } from "react-router-dom";
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
import { useState } from "react";

export default function LoanStats({ loans }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [isOpen2, setIsOpen2] = useState(false);

    const navigate = useNavigate();

    // Agrupar recibidos por prestamista
    const receivedGrouped = loans.received.reduce((acc, curr) => {
        const name = curr.lender;
        acc[name] = (acc[name] || 0) + curr.principalAmount;
        return acc;
    }, {} as Record<string, number>);

    const receivedList = Object.entries(receivedGrouped);

    const givenGrouped = loans.given.reduce((acc, curr) => {
        const name = curr.lender;
        acc[name] = (acc[name] || 0) + curr.principalAmount;
        return acc;
    }, {} as Record<string, number>);

    const givendList = Object.entries(givenGrouped);

    const activeItems1 = isOpen2 ? givendList.length : 0;
    const activeItems2 = isOpen ? receivedList.length : 0;
    const currentMaxItems = Math.max(activeItems1, activeItems2);

    return (
        <div style={{ '--total-items': currentMaxItems, } as React.CSSProperties} className={`card loan-card-container ${(isOpen || isOpen2) ? 'is-open' : ''}`}>
            <div className="card-head">
                <h3 className="card-head-title">Préstamos</h3>
                <button onClick={() => navigate("/loans")} className="btn-ghost">Gestionar →</button>
            </div>

            <div className="default-row">
                <div className="loan-stat-item stack-column">
                    <div className="header-total givend" onClick={() => setIsOpen2(!isOpen2)}>
                        <p className="summary-label ">Me deben</p>
                        <strong className="expense">{formatCurrency(loans.totalAmtDue)}</strong>
                        <span className={`arrow-icon ${isOpen2 ? 'up' : ''}`}>▼</span>
                    </div>

                    <div className="stack-area">
                        {givendList.map(([name, amount], index) => (
                            <div
                                className="detail-card givend"
                                key={name}
                                style={{
                                    '--index': index,
                                    opacity: isOpen2 ? 1 : 0,
                                    pointerEvents: isOpen2 ? 'all' : 'none'
                                } as React.CSSProperties}
                            >
                                <span className="detail-name">{name}</span>
                                <span className="detail-amount">{formatCurrency(amount)}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="loan-divider"></div>

                {/* Columna: Yo debo (Con el Stack) */}
                <div className="loan-stat-item stack-column">

                    <div className="header-total debt" onClick={() => setIsOpen(!isOpen)}>
                        <p className="summary-label">Yo debo</p>
                        <strong className="expense">{formatCurrency(loans.totalDebt)}</strong>
                        <span className={`arrow-icon ${isOpen ? 'up' : ''}`}>▼</span>
                    </div>

                    <div className="stack-area">
                        {receivedList.map(([name, amount], index) => (
                            <div
                                className="detail-card debt"
                                key={name}
                                style={{
                                    '--index': index,
                                    opacity: isOpen ? 1 : 0,
                                    pointerEvents: isOpen ? 'all' : 'none'
                                } as React.CSSProperties}
                            >
                                <span className="detail-name">{name}</span>
                                <span className="detail-amount">{formatCurrency(amount)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div >
    );
}
