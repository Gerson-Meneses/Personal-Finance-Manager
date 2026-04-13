import { useState, useMemo } from "react";
import { useLoans } from "../../../features/loans/hooks";
import LoanForm from "../../../features/loans/components/loanForm";
import LoanCard from "../../../features/loans/components/loanCards/loanCard";
import LenderGroup from "../../../features/loans/components/LenderGroup/LenderGroup"; // El nuevo componente
import { Plus, LayoutGrid, Users } from "lucide-react";
import "./LoansPage.css";
import LoadingScreen from "../../../shared/components/LoadingScreen/LoadingScreen";
import type { Loan } from "../../../features/loans/types";
import ModalPortal from "../../../shared/components/ModalPortal/ModalPortal";

interface ByLender {
    [key: string]: Loan[]
}

export default function LoansPage() {
    const [showForm, setShowForm] = useState(false);
    const [viewMode, setViewMode] = useState("loan"); // 'loan' o 'lender'

    const { loans, loading, createLoan } = useLoans();

    // Memorizamos la agrupación para evitar cálculos innecesarios en cada render
    const byLenders = useMemo(() => {
        return loans.reduce((acc: ByLender, loan) => {
            const key = loan.lender;
            if (!acc[key]) acc[key] = [];
            acc[key].push(loan);
            return acc;
        }, {});
    }, [loans]);

    const lenders = Object.keys(byLenders);

    if (loading) return <LoadingScreen />;

    return (
        <div className="loans-container">
            <header className="loans-header">
                <div>
                    <h1>Mis Préstamos</h1>
                    <p className="subtitle">Gestiona lo que debes y lo que te deben</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className={`btn-add ${showForm ? 'active' : ''}`}
                >
                    <Plus size={20} />
                    {showForm ? "Cerrar" : "Nuevo Préstamo"}
                </button>
            </header>

            <ModalPortal isOpen={showForm} onClose={()=>setShowForm(false)}>
                <LoanForm lenders={lenders} mutation={createLoan} />
            </ModalPortal>


            <div className="view-controls">
                <div className="filter-group">
                    <button
                        className={viewMode === 'loan' ? 'active' : ''}
                        onClick={() => setViewMode('loan')}
                    >
                        <LayoutGrid size={18} /> Individual
                    </button>
                    <button
                        className={viewMode === 'lender' ? 'active' : ''}
                        onClick={() => setViewMode('lender')}
                    >
                        <Users size={18} /> Por Persona
                    </button>
                </div>
            </div>

            <div className="loans-content">
                {viewMode === 'loan' ? (
                    <div className="loans-grid">
                        {loans.map((loan) => (
                            <LoanCard key={loan.id} loan={loan} />
                        ))}
                    </div>
                ) : (
                    <div className="lenders-list">
                        {lenders.map(lender => (
                            <LenderGroup
                                key={lender}
                                name={lender}
                                loans={byLenders[lender]}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}