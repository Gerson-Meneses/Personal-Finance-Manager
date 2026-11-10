import { useMemo, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, HandCoins, Plus, Users } from "lucide-react";
import LoadingScreen from "../../../shared/components/LoadingScreen/LoadingScreen";
import ModalPortal from "../../../shared/components/ModalPortal/ModalPortal";
import LoanForm from "../../../features/loans/components/CreateLoanForm/loanForm";
import { LenderSummary } from "../../../features/loans/components/LoanCardSummary/LenderSummary";
import { useLoansQuery, useLoanSummary } from "../../../features/loans/hooks";
import { SearchInput } from "../../../shared/components/SearchInput/SearchInput";
import { formatCurrency } from "../../../shared/utils/formatCurrency";
import "./LoansPage.css";

type LenderFilter = "all" | "given" | "received";

const normalize = (value: string) =>
    value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export const LoansPage = () => {
    const { summary = [], isLoading } = useLoanSummary({ status: "PENDING" });
    const { createLoan } = useLoansQuery()
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<LenderFilter>("all");

    const lenders = summary.map(item => item.lender);
    const uniqueLenders = Array.from(new Set(lenders));

    const totals = useMemo(() => {
        let given = 0;
        let received = 0;
        let activeLoans = 0;
        let totalAmount = 0;

        for (const item of summary) {
            given += item.byType.GIVEN?.totalRemaining ?? 0;
            received += item.byType.RECEIVED?.totalRemaining ?? 0;
            activeLoans += item.total.loanCount;
            totalAmount += item.total.totalAmount;
        }

        return {
            given,
            received,
            net: given - received,
            activeLoans,
            people: summary.length,
            totalAmount,
        };
    }, [summary]);

    const visible = useMemo(() => {
        const q = normalize(search.trim());
        return summary.filter((item) => {
            const matchesSearch = !q || normalize(item.lender).includes(q);
            const matchesType =
                filter === "all" ||
                (filter === "given" ? !!item.byType.GIVEN : !!item.byType.RECEIVED);
            return matchesSearch && matchesType;
        });
    }, [summary, search, filter]);

    if (isLoading) {
        return <LoadingScreen message="Cargando los datos de préstamos." />;
    }

    return (
        <div className="page-container loans-page">
            <header className="loans-header card">
                <div className="loans-header__text">
                    <span className="loans-header__eyebrow">Deudas y préstamos</span>
                    <h1>Préstamos</h1>
                    <p className="text-muted">
                        Controla lo que te deben y lo que debes, persona por persona.
                    </p>
                </div>
                <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
                    <Plus size={18} />
                    Nuevo préstamo
                </button>
            </header>

            <section className="loans-stats">
                <article className="loan-stat card loan-stat--given">
                    <span className="loan-stat__icon"><ArrowUpRight size={17} /></span>
                    <div>
                        <span className="loan-stat__label">Me deben</span>
                        <strong className="amount-font">{formatCurrency(totals.given)}</strong>
                    </div>
                </article>

                <article className="loan-stat card loan-stat--received">
                    <span className="loan-stat__icon"><ArrowDownLeft size={17} /></span>
                    <div>
                        <span className="loan-stat__label">Yo debo</span>
                        <strong className="amount-font">{formatCurrency(totals.received)}</strong>
                    </div>
                </article>

                <article className="loan-stat card loan-stat--net">
                    <span className="loan-stat__icon"><HandCoins size={17} /></span>
                    <div>
                        <span className="loan-stat__label">Balance</span>
                        <strong className={`amount-font ${totals.net >= 0 ? "text-success" : "text-danger"}`}>
                            {formatCurrency(totals.net)}
                        </strong>
                    </div>
                </article>

                <article className="loan-stat card loan-stat--people">
                    <span className="loan-stat__icon"><Users size={17} /></span>
                    <div>
                        <span className="loan-stat__label">Personas</span>
                        <strong className="amount-font">{totals.people}</strong>
                    </div>
                    <small>{totals.activeLoans} activo{totals.activeLoans !== 1 ? "s" : ""}</small>
                </article>
            </section>

            <section className="loans-toolbar card">
                <SearchInput
                    value={search}
                    onChange={setSearch}
                    placeholder="Buscar por persona..."
                />

                <div className="loans-filter-chips" role="group" aria-label="Filtrar por tipo">
                    {([
                        { value: "all", label: "Todos" },
                        { value: "given", label: "Me deben" },
                        { value: "received", label: "Yo debo" },
                    ] as { value: LenderFilter; label: string }[]).map((opt) => (
                        <button
                            key={opt.value}
                            type="button"
                            className={`loans-chip ${filter === opt.value ? "is-active" : ""}`}
                            onClick={() => setFilter(opt.value)}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </section>

            {summary.length === 0 ? (
                <div className="empty-state card loans-empty">
                    <span className="loans-empty__icon"><HandCoins size={22} /></span>
                    <h3>Sin préstamos activos</h3>
                    <p className="text-muted">Registra un préstamo para empezar a controlar los pagos.</p>
                    <button className="btn-outline" onClick={() => setIsModalOpen(true)}>
                        Crear mi primer préstamo
                    </button>
                </div>
            ) : visible.length === 0 ? (
                <div className="empty-state card loans-empty">
                    <h3>Sin resultados</h3>
                    <p className="text-muted">
                        {search ? `Ninguna persona coincide con «${search}».` : "No hay préstamos con ese filtro."}
                    </p>
                    <button
                        className="btn-ghost"
                        onClick={() => {
                            setSearch("");
                            setFilter("all");
                        }}
                    >
                        Limpiar filtros
                    </button>
                </div>
            ) : (
                <div className="loans-grid">
                    {visible.map((item) => (
                        <LenderSummary key={item.lender} summaryLender={item} />
                    ))}
                </div>
            )}

            <ModalPortal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <LoanForm
                    mutation={createLoan}
                    lenders={uniqueLenders}
                    onSuccess={() => setIsModalOpen(false)}
                    onClose={() => setIsModalOpen(false)}
                />
            </ModalPortal>
        </div>
    );
};
