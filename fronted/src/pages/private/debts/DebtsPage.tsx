import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    AlertTriangle,
    ArrowDownLeft,
    ArrowUpRight,
    HandCoins,
    Plus,
    Search,
    Users,
    Wallet,
} from "lucide-react";
import LoadingScreen from "../../../shared/components/LoadingScreen/LoadingScreen";
import ModalPortal from "../../../shared/components/ModalPortal/ModalPortal";
import { SearchInput } from "../../../shared/components/SearchInput/SearchInput";
import { QueryErrorState } from "../../../shared/components/QueryErrorState/QueryErrorState";
import { formatCurrency } from "../../../shared/utils/formatCurrency";
import { useDebtHub } from "../../../features/debts/hooks";
import { DebtContactCard } from "../../../features/debts/components/DebtContactCard";
import { ActiveDebtCard } from "../../../features/debts/components/ActiveDebtCard";
import { useLoansQuery } from "../../../features/loans/hooks";
import LoanForm from "../../../features/loans/components/CreateLoanForm/loanForm";
import "./DebtsPage.css";

type DebtFilter = "active" | "all" | "given" | "received" | "overdue";
type DebtTab = "contacts" | "debts";

const normalize = (value: string) =>
    value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export default function DebtsPage() {
    const navigate = useNavigate();
    const { hub, loading, error, refetch } = useDebtHub();
    const { createLoan } = useLoansQuery();
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<DebtFilter>("active");
    const [tab, setTab] = useState<DebtTab>("contacts");
    const [showLoanForm, setShowLoanForm] = useState(false);

    const contactsWithDebt = useMemo(
        () => hub.rows.filter((row) => row.loanCount > 0).length,
        [hub.rows]
    );

    const visibleContacts = useMemo(() => {
        const q = normalize(search.trim());
        return hub.rows.filter((row) => {
            if (q && !normalize(row.name).includes(q)) return false;
            if (filter === "active") return row.loanCount > 0;
            if (filter === "given") return row.given > 0;
            if (filter === "received") return row.received > 0;
            if (filter === "overdue") return row.overdueCount > 0;
            return true;
        });
    }, [hub.rows, search, filter]);

    const visibleLoans = useMemo(() => {
        const q = normalize(search.trim());
        return hub.loans.filter((loan) => {
            if (q && !normalize(loan.lender).includes(q) && !normalize(loan.description ?? "").includes(q)) {
                return false;
            }
            if (filter === "given") return loan.type === "GIVEN";
            if (filter === "received") return loan.type === "RECEIVED";
            if (filter === "overdue") return loan.status === "OVERDUE";
            return true;
        });
    }, [hub.loans, search, filter]);

    const rowByContactId = useMemo(
        () =>
            new Map(
                hub.rows
                    .filter((row) => row.contactId)
                    .map((row) => [row.contactId as string, row])
            ),
        [hub.rows]
    );

    const lenderOptions = useMemo(
        () => [...new Set(hub.contacts.map((contact) => contact.name))],
        [hub.contacts]
    );

    if (loading) return <LoadingScreen message="Conectando personas y deudas..." />;

    if (error && hub.rows.length === 0) {
        return (
            <div className="page-container debts-page">
                <QueryErrorState
                    title="No se pudieron cargar las deudas"
                    error={error instanceof Error ? error.message : String(error)}
                    onRetry={() => refetch()}
                    retrying={false}
                />
            </div>
        );
    }

    return (
        <div className="page-container debts-page">
            <header className="debts-header card">
                <div className="debts-header__text">
                    <span className="debts-header__eyebrow">Personas, préstamos y deuda</span>
                    <h1>Deudas</h1>
                    <p className="text-muted">
                        Cada persona, cada préstamo y cada cuota en una sola vista conectada.
                    </p>
                </div>
                <div className="debts-header__actions">
                    <Link className="btn-secondary debts-contacts-link" to="/contacts">
                        <Users size={16} /> Contactos
                    </Link>
                    <button type="button" className="btn-primary" onClick={() => setShowLoanForm(true)}>
                        <Plus size={17} /> Nuevo préstamo
                    </button>
                </div>
            </header>

            <section className="debts-stats">
                <article className="debts-stat card debts-stat--given">
                    <span className="debts-stat__icon"><ArrowUpRight size={17} /></span>
                    <div>
                        <span>Me deben</span>
                        <strong className="amount-font text-success">{formatCurrency(hub.summary.given)}</strong>
                        <small>{hub.summary.people} persona{hub.summary.people === 1 ? "" : "s"} con deuda</small>
                    </div>
                </article>

                <article className="debts-stat card debts-stat--received">
                    <span className="debts-stat__icon"><ArrowDownLeft size={17} /></span>
                    <div>
                        <span>Yo debo</span>
                        <strong className="amount-font text-danger">{formatCurrency(hub.summary.received)}</strong>
                        <small>{hub.summary.activeLoans} préstamo{hub.summary.activeLoans === 1 ? "" : "s"} activo{hub.summary.activeLoans === 1 ? "" : "s"}</small>
                    </div>
                </article>

                <article className="debts-stat card debts-stat--net">
                    <span className="debts-stat__icon"><Wallet size={17} /></span>
                    <div>
                        <span>Balance neto</span>
                        <strong className={`amount-font ${hub.summary.net >= 0 ? "text-success" : "text-danger"}`}>
                            {formatCurrency(hub.summary.net)}
                        </strong>
                        <small>Me deben menos lo que debo</small>
                    </div>
                </article>

                <article className="debts-stat card debts-stat--risk">
                    <span className="debts-stat__icon"><AlertTriangle size={17} /></span>
                    <div>
                        <span>Vencidas</span>
                        <strong className={`amount-font ${hub.summary.overdue > 0 ? "text-danger" : ""}`}>
                            {hub.summary.overdue}
                        </strong>
                        <small>{contactsWithDebt} contacto{contactsWithDebt === 1 ? "" : "s"} con deuda</small>
                    </div>
                </article>
            </section>

            <section className="debts-toolbar card">
                <div className="debts-toolbar__search">
                    <SearchInput
                        value={search}
                        onChange={setSearch}
                        placeholder="Buscar persona o préstamo..."
                    />
                </div>
                <div className="debts-filter-chips" role="group" aria-label="Filtrar deudas">
                    {([
                        { value: "active", label: "Activos" },
                        { value: "given", label: "Me deben" },
                        { value: "received", label: "Yo debo" },
                        { value: "overdue", label: "Vencidas" },
                        { value: "all", label: "Todos" },
                    ] as { value: DebtFilter; label: string }[]).map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            className={`debts-chip ${filter === option.value ? "is-active" : ""}`}
                            aria-pressed={filter === option.value}
                            onClick={() => setFilter(option.value)}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </section>

            <nav className="debts-tabs card" role="tablist" aria-label="Vistas de deudas">
                <button
                    type="button"
                    role="tab"
                    aria-selected={tab === "contacts"}
                    className={`debts-tab ${tab === "contacts" ? "is-active" : ""}`}
                    onClick={() => setTab("contacts")}
                >
                    <Users size={16} /> Personas
                    <span>{visibleContacts.length}</span>
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={tab === "debts"}
                    className={`debts-tab ${tab === "debts" ? "is-active" : ""}`}
                    onClick={() => setTab("debts")}
                >
                    <HandCoins size={16} /> Deudas activas
                    <span>{visibleLoans.length}</span>
                </button>
            </nav>

            {tab === "contacts" ? (
                visibleContacts.length === 0 ? (
                    <div className="empty-state card debts-empty">
                        <span className="debts-empty__icon"><Users size={22} /></span>
                        <h3>{hub.rows.length === 0 ? "Aún no tienes contactos" : "Sin resultados"}</h3>
                        <p className="text-muted">
                            {hub.rows.length === 0
                                ? "Crea un préstamo o un contacto para empezar."
                                : "Prueba con otro nombre o cambia el filtro."}
                        </p>
                        {hub.rows.length === 0 && (
                            <Link className="btn-primary" to="/contacts">
                                Gestionar contactos
                            </Link>
                        )}
                    </div>
                ) : (
                    <section className="debts-grid" aria-label="Personas y deudas">
                        {visibleContacts.map((row) => (
                            <DebtContactCard key={row.id} row={row} />
                        ))}
                    </section>
                )
            ) : visibleLoans.length === 0 ? (
                <div className="empty-state card debts-empty">
                    <span className="debts-empty__icon"><Search size={22} /></span>
                    <h3>Sin deudas activas</h3>
                    <p className="text-muted">
                        No hay préstamos activos con los filtros actuales.
                    </p>
                    <button type="button" className="btn-primary" onClick={() => setShowLoanForm(true)}>
                        Registrar préstamo
                    </button>
                </div>
            ) : (
                <section className="debts-loans" aria-label="Deudas activas">
                    {visibleLoans.map((loan) => {
                        const row = loan.contact?.id ? rowByContactId.get(loan.contact.id) : undefined;
                        return (
                            <ActiveDebtCard
                                key={loan.id}
                                loan={loan}
                                installments={hub.installments}
                                onOpen={row?.contactId ? () => navigate(`/debts/${row.contactId}`) : undefined}
                            />
                        );
                    })}
                </section>
            )}

            <ModalPortal isOpen={showLoanForm} onClose={() => setShowLoanForm(false)}>
                <LoanForm
                    mutation={createLoan}
                    lenders={lenderOptions}
                    onSuccess={() => {
                        setShowLoanForm(false);
                        void refetch();
                    }}
                    onClose={() => setShowLoanForm(false)}
                />
            </ModalPortal>
        </div>
    );
}
