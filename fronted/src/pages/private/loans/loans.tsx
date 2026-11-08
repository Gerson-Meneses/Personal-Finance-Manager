import { useState } from "react";
import LoadingScreen from "../../../shared/components/LoadingScreen/LoadingScreen";
import { Plus } from "lucide-react";
import ModalPortal from "../../../shared/components/ModalPortal/ModalPortal";
import LoanForm from "../../../features/loans/components/CreateLoanForm/loanForm";
import { LenderSummary } from "../../../features/loans/components/LoanCardSummary/LenderSummary";
import { useLoansQuery, useLoanSummary } from "../../../features/loans/hooks";

export const LoansPage = () => {
    const { summary = [], isLoading } = useLoanSummary({ status: "PENDING" });
    const { createLoan } = useLoansQuery()
    const [isModalOpen, setIsModalOpen] = useState(false);

    const lenders = summary.map(item => item.lender);
    const uniqueLenders = Array.from(new Set(lenders));

    if (isLoading) {
        return <LoadingScreen message="Cargando los datos de préstamos." />;
    }

    return (
        <div className="page-container">
            <header className="page-header card">
                <div>
                    <h1 className="card-head-title">Préstamos</h1>
                    <p className="text-muted">Gestiona tus préstamos y pagos</p>
                    <p className="text-muted">Total: 0</p>
                </div>
                <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
                    <Plus size={20} />
                    Nuevo Préstamo
                </button>
            </header>

            <div className="grid-auto">
                {summary.map(LoanSummary => <LenderSummary key={LoanSummary.lender} summaryLender={LoanSummary} />)}
            </div>

            <ModalPortal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <LoanForm
                    mutation={createLoan}
                    lenders={uniqueLenders}
                    onSuccess={() => setIsModalOpen(false)}
                />
            </ModalPortal>
        </div>
    );
};
