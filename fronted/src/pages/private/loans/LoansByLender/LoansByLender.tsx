import { useParams } from "react-router-dom";
import { QuickPayForm } from "../../../../features/LoanPayments/QuickPay";
import NotFoundView from "../../../../shared/components/NotFoundView/NotFoundView";
import { useLoansQuery, useLoanSummary } from "../../../../features/loans/hooks";
import { LenderSummary } from "../../../../features/loans/components/LoanCardSummary/LenderSummary";
import LoadingScreen from "../../../../shared/components/LoadingScreen/LoadingScreen";
import { useCallback, useState } from "react";
import ModalPortal from "../../../../shared/components/ModalPortal/ModalPortal";

import { initialQuery } from "../../../../features/loans/types";
import "./LoansByLender.css"
import { LoanCard } from "../../../../features/loans/components/LoanCard/LoanCard";
import LoanForm from "../../../../features/loans/components/CreateLoanForm/loanForm";
import { LoanQuickHistory } from "../../../../features/loans/components/LoansHistory/LoansHistoryList";
import { TypeToggle } from "../../../../shared/components/TypeToggle/TypeToggle";
import { useFilterURL } from "../../../../shared/Hooks/UseFiltersUrl.hook";
import { useClientSearch } from "../../../../shared/Hooks/UseClientSearch";
import { normalizeLoan } from "../../../../features/loans/utils/NormalizeLoan";
import type { LoanQueryFiltersFormInput } from "../../../../features/LoanPayments/types";
import { LoansFilter } from "../../../../features/loans/components/LoansFilter/LoansFilter";

type Tab = "loans" | "timeline";

export const LoansByLender = () => {
    const { lender } = useParams();

    const { filters, saveFiltersToURL, clearFiltersFromURL } = useFilterURL<LoanQueryFiltersFormInput>(initialQuery)
    const { search, setSearch, filtered } = useClientSearch(useCallback(normalizeLoan, []))

    const [showModal, setShowModal] = useState(false);
    const [showModal2, setShowModal2] = useState(false);
    const [tab, setTab] = useState<Tab>("loans");

    const queryForBackend = search
        ? { ...filters, limit: 9999, page: 1 }
        : filters

    const { summary = [], isLoading: isLoading2 } = useLoanSummary({ status: "PENDING" });
    const { loans = [], isLoading: isLoading1, createLoan, meta } = useLoansQuery({ lender, status: "PENDING", ...queryForBackend });

    if (isLoading1 || isLoading2) return <LoadingScreen />;
    if (!lender) return <NotFoundView />;

    const filteredLoans = filtered(loans)

    const lenderSummary = summary.find((s) => s.lender === lender) ?? summary[0];

    const handleFiltersChange = (newFilters: LoanQueryFiltersFormInput) => {
        saveFiltersToURL({ ...newFilters, page: 1 })
    }

    const handlePageChange = (newPage: number) => {
        saveFiltersToURL({ ...filters, page: newPage })
    }

    return (
        <div className="page-container animate-fade-in">
            <div className="detail-layout">

                {/* ── ASIDE ─────────────────────────────────── */}
                <aside className="default-column">
                    <LenderSummary details={false} summaryLender={lenderSummary} />

                    <div className="card action-card mt-6">
                        <h3>• Acciones Rápidas</h3>
                        <div className="action-buttons">
                            <button
                                onClick={() => setShowModal(true)}
                                className="btn-primary"
                            >
                                Pago rápido
                            </button>
                            <button
                                onClick={() => setShowModal2(true)}
                                className="btn-secondary text-blue-600"
                            >
                                Nuevo préstamo
                            </button>

                        </div>
                    </div>

                    <section className="card flex flex-col gap-4 ">
                        <h3>• Vista</h3>
                        <section className="flex justify-center items-center">

                            <TypeToggle<Tab>
                                value={tab}
                                onChange={(val) => setTab(val)}
                                icon={""}
                                label=""
                                leftOption={{
                                    label: `Prestamos ${filteredLoans.length > 0 ? `(${filteredLoans.length})` : ''}`,
                                    value: "loans",
                                    icon: "HandCoins",
                                    color: "#2563eb"
                                }}
                                rightOption={{
                                    label: "Actividad",
                                    value: "timeline",
                                    icon: "History",
                                    color: "#16a34a"
                                }}
                            ></TypeToggle>
                        </section>
                    </section>
                </aside>

                {/* ── MAIN ──────────────────────────────────── */}
                <main className=" flex flex-col gap-6">

                    {/* Filter bar */}
                    <LoansFilter
                        query={filters}
                        onChange={handleFiltersChange}
                        onReset={clearFiltersFromURL}
                        search={search}
                        onSearchChange={setSearch}
                    />

                    {/* Content */}
                    {tab === "loans" && (
                        <div className="card list-container">
                            {filteredLoans.length === 0 ? (
                                <p className="loans-list__empty">
                                    No se encontraron préstamos con los filtros actuales.
                                </p>
                            ) : (
                                filteredLoans.map((loan) => (
                                    <LoanCard key={loan.id} loan={loan} search={search}  />
                                ))
                            )}
                        </div>
                    )}

                    {tab === "timeline" && (
                        <div className="card">
                            <LoanQuickHistory defaultOrder={filters.order} search={search} loans={filteredLoans} />
                        </div>
                    )}
                    {/* Paginación solo visible cuando no hay búsqueda activa */}
                    {!search && meta?.totalPages > 1 && (
                        <div className="tf-pagination">
                            <button
                                className="btn-secondary"
                                disabled={!filters.page || Number(filters.page) <= 1}
                                onClick={() => handlePageChange((Number(filters.page) ?? 1) - 1)}
                            >
                                ← Anterior
                            </button>
                            <span className="tf-page-info">
                                Página {Number(filters.page) ?? 1}/{meta.totalPages}
                            </span>
                            <button
                                className="btn-secondary"
                                disabled={filters.page ? Number(filters.page) >= meta.totalPages : false}
                                onClick={() => handlePageChange((Number(filters.page) ?? 1) + 1)}
                            >
                                Siguiente →
                            </button>
                        </div>
                    )}
                </main>
            </div>

            {/* Modal */}
            <ModalPortal isOpen={showModal} onClose={() => setShowModal(false)}>
                <QuickPayForm lender={lender} onClose={() => setShowModal(false)} />
            </ModalPortal>
            <ModalPortal isOpen={showModal2} onClose={() => setShowModal2(false)}>
                <LoanForm mutation={createLoan} initialData={{ lender }} onClose={() => setShowModal2(false)} />
            </ModalPortal>
        </div>
    );
};