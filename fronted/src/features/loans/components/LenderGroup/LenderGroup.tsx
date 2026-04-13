import LoanCard from "../loanCards/loanCard";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { formatCurrency } from "../../../../shared/utils/formatCurrency";
import { getRemaining } from "../../utils";

export default function LenderGroup({ name, loans }: any) {
    const [isExpanded, setIsExpanded] = useState(true);
    const totalPending = loans.reduce((acc: any, loan: any) => {

        return acc + getRemaining(loan);
    }, 0);

    return (
        <div className="lender-group">
            <div className="lender-header" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="lender-info">
                    <h3>{name}</h3>
                    <span className="badge">{loans.length} préstamos</span>
                </div>
                <div className="lender-summary">
                    <span className="total-amount">Deuda total: {formatCurrency(totalPending)}</span>
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
            </div>
            {isExpanded && (
                <div className="lender-loans-grid">
                    {loans.map((loan: any) => (
                        <LoanCard key={loan.id} loan={loan} />
                    ))}
                </div>
            )}
        </div>
    );
}