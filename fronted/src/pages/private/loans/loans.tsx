import { useState } from "react";
import { useLoans } from "../../../features/loans/hooks";
import LoadingScreen from "../../../shared/components/LoadingScreen/LoadingScreen";
import { SuccessToast } from "../../../shared/components/SuccesToast/SuccesToast";
import { Plus } from "lucide-react";
import ModalPortal from "../../../shared/components/ModalPortal/ModalPortal";
import LoanForm from "../../../features/loans/components/loanForm";
import { LenderSummary } from "../../../features/loans/components/LoanCardSummary/LenderSummary";

export const LoansPage = () => {
    const { total, loading, createLoan, summary = [] } = useLoans({}, { status: "PENDING" });
    const [toast, setToast] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const lenders = summary.map(item => item.lender);
    const uniqueLenders = Array.from(new Set(lenders));

    if (loading) {
        return <LoadingScreen message="Cargando los datos de préstamos." />;
    }

    return (
        <div className="page-container">
            <header className="page-header card">
                <div>
                    <h1 className="card-head-title">Préstamos</h1>
                    <p className="text-muted">Gestiona tus préstamos y pagos</p>
                    <p className="text-muted">Total: {total}</p>
                </div>
                <SuccessToast isSucces={toast} successText="Préstamo creado con éxito">
                    <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
                        <Plus size={20} />
                        Nuevo Préstamo
                    </button>
                </SuccessToast>
            </header>

            <div className="grid-auto">
                {summary.map(LoanSummary => <LenderSummary summaryLender={LoanSummary} />)}
            </div>

            <ModalPortal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <LoanForm
                    mutation={createLoan}
                    lenders={uniqueLenders}
                    onSuccess={() => {
                        setToast(true);
                        setIsModalOpen(false); // Cierra el modal automáticamente al éxito
                    }}
                />
            </ModalPortal>
        </div>
    );
};
