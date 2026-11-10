import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { ArrowDownLeft, ArrowUpRight, HandCoins, Plus, Wallet } from "lucide-react";
import { QuickPayForm } from "../../../../features/LoanPayments/QuickPay";
import NotFoundView from "../../../../shared/components/NotFoundView/NotFoundView";
import { useLoansQuery, useLoanSummary } from "../../../../features/loans/hooks";
import LoadingScreen from "../../../../shared/components/LoadingScreen/LoadingScreen";
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
import { formatCurrency } from "../../../../shared/utils/formatCurrency";

type Tab = "loans" | "timeline";

const getInitials = (name: string) =>
    name
        .split(" ")
        .filter(Boolean)
        .map((part) => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();

export const LoansByLender = () => {
    const { lender = "" } = useParams();

    const { filters, saveFiltersToURL, clearFiltersFromURL } = useFilterURL<LoanQueryFiltersFormInput>(initialQuery)
    const { search, setSearch, filtered } = useClientSearch(normalizeLoan)

    const [showModal, setShowModal] = useState(false);
    const [showModal2, setShowModal2] = useState(false);
    const [tab, setTab] = useState<Tab>("loans");

    const queryForBackend = search
        ? { ...filters, limit: 9999, page: 1 }
        : filters

    const { summary = [], isLoading: isLoading2 } = useLoanSummary({ status: "PENDING" });
    const { loans = [], isLoading: isLoading1, createLoan, meta } = useLoansQuery({ lender, status: "PENDING", ...queryForBackend });

    const lenderSummary = useMemo(
        () => summary.find((s) => s.lender === lender),
        [summary, lender]
    );

    const filteredLoans = filtered(loans)

    if (isLoading1 || isLoading2) return <LoadingScreen />;
    if (!lender) return <NotFoundView />;

    const given = lenderSummary?.byType.GIVEN;
    const received = lenderSummary?.byType.RECEIVED;
    const total = lenderSummary?.total;

    const givenRemaining = given?.totalRemaining ?? 0;
    const receivedRemaining = received?.totalRemaining ?? 0;
    const net = givenRemaining - receivedRemaining;
    const activeLoans = total?.loanCount ?? filteredLoans.length;
    const totalAmount = total?.totalAmount ?? filteredLoans.reduce((sum, loan) => sum + loan.principalAmount, 0);

    const handleFiltersChange = (newFilters: LoanQueryFiltersFormInput) => {
        saveFiltersToURL({ ...newFilters, page: 1 })
    }

    const handlePageChange = (newPage: number) => {
        saveFiltersToURL({ ...filters, page: newPage })
    }

    return (
        <div className="page-container lender-detail animate-fade-in">
            <header className="lender-hero card">
                <div className="lender-hero__identity">
                    <span className="lender-hero__avatar" aria-hidden="true">
                        {getInitials(lender)}
                    </span>
                    <div className="lender-hero__text">
                        <span className="lender-hero__eyebrow">Préstamos con</span>
                        <h1>{lender}</h1>
                        <p className="text-muted">
                            {activeLoans} préstamo{activeLoans !== 1 ? "s" : ""} activo{activeLoans !== 1 ? "s" : ""}
                            {" · "}
                            {formatCurrency(totalAmount)} prestado en total
                        </p>
                    </div>
                </div>

                <div className={`lender-hero__net ${net >= 0 ? "is-positive" : "is-negative"}`}>
                    <small>{net >= 0 ? "A favor" : "Por pagar"}</small>
                    <strong className="amount-font">{formatCurrency(Math.abs(net))}</strong>
                </div>

                <div className="lender-hero__actions">
                    <button className="btn-primary" onClick={() => setShowModal(true)}>
                        <Wallet size={17} />
                        Pago rápido
                    </button>
                    <button className="btn-secondary" onClick={() => setShowModal2(true)}>
                        <Plus size={17} />
                        Nuevo préstamo
                    </button>
                </div>
            </header>

            <section className="lender-stats">
                <article className="lender-stat card lender-stat--given">
                    <span className="lender-stat__icon"><ArrowUpRight size={17} /></span>
                    <div>
                        <span className="lender-stat__label">Me deben</span>
                        <strong className="amount-font">{formatCurrency(givenRemaining)}</strong>
                        <small>{given?.loanCount ?? 0} préstamo{given?.loanCount !== 1 ? "s" : ""}</small>
                    </div>
                </article>

                <article className="lender-stat card lender-stat--received">
                    <span className="lender-stat__icon"><ArrowDownLeft size={17} /></span>
                    <div>
                        <span className="lender-stat__label">Yo debo</span>
                        <strong className="amount-font">{formatCurrency(receivedRemaining)}</strong>
                        <small>{received?.loanCount ?? 0} préstamo{received?.loanCount !== 1 ? "s" : ""}</small>
                    </div>
                </article>

                <article className="lender-stat card lender-stat--total">
                    <span className="lender-stat__icon"><HandCoins size={17} /></span>
                    <div>
                        <span className="lender-stat__label">Total prestado</span>
                        <strong className="amount-font">{formatCurrency(totalAmount)}</strong>
                        <small>Historial con esta persona</small>
                    </div>
                </article>
            </section>

            <LoansFilter
                query={filters}
                onChange={handleFiltersChange}
                onReset={clearFiltersFromURL}
                search={search}
                onSearchChange={setSearch}
            />

            <section className="lender-viewbar card">
                <span className="lender-viewbar__label">Vista</span>
                <TypeToggle<Tab>
                    value={tab}
                    onChange={(val) => setTab(val)}
                    icon=""
                    label=""
                    leftOption={{
                        label: `Préstamos${filteredLoans.length > 0 ? ` (${filteredLoans.length})` : ""}`,
                        value: "loans",
                        icon: "HandCoins",
                        color: "#8b5cf6"
                    }}
                    rightOption={{
                        label: "Actividad",
                        value: "timeline",
                        icon: "History",
                        color: "#0891b2"
                    }}
                />
            </section>

            {tab === "loans" && (
                <div className="card lender-loans-list">
                    {filteredLoans.length === 0 ? (
                        <p className="lender-loans-list__empty">
                            No se encontraron préstamos con los filtros actuales.
                        </p>
                    ) : (
                        filteredLoans.map((loan) => (
                            <LoanCard key={loan.id} loan={loan} search={search} />
                        ))
                    )}
                </div>
            )}

            {tab === "timeline" && (
                <div className="card lender-timeline">
                    <LoanQuickHistory defaultOrder={filters.order} search={search} loans={filteredLoans} />
                </div>
            )}

            {!search && meta?.totalPages > 1 && (
                <div className="tf-pagination">
                    <button
                        className="btn-secondary"
                        disabled={!filters.page || Number(filters.page) <= 1}
                        onClick={() => handlePageChange((Number(filters.page) || 1) - 1)}
                    >
                        ← Anterior
                    </button>
                    <span className="tf-page-info">
                        Página {Number(filters.page) || 1}/{meta.totalPages}
                    </span>
                    <button
                        className="btn-secondary"
                        disabled={(Number(filters.page) || 1) >= meta.totalPages}
                        onClick={() => handlePageChange((Number(filters.page) || 1) + 1)}
                    >
                        Siguiente →
                    </button>
                </div>
            )}

            <ModalPortal isOpen={showModal} onClose={() => setShowModal(false)}>
                <QuickPayForm lender={lender} onClose={() => setShowModal(false)} />
            </ModalPortal>
            <ModalPortal isOpen={showModal2} onClose={() => setShowModal2(false)}>
                <LoanForm mutation={createLoan} initialData={{ lender }} onClose={() => setShowModal2(false)} />
            </ModalPortal>
        </div>
    );
};
