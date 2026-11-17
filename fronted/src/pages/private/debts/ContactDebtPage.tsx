import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";
import "dayjs/locale/es";
import {
    AlertTriangle,
    ArrowDownLeft,
    ArrowRight,
    ArrowUpRight,
    CalendarClock,
    CheckCircle2,
    ChevronDown,
    HandCoins,
    History,
    Merge,
    Pencil,
    Plus,
    Wallet,
} from "lucide-react";
import LoadingScreen from "../../../shared/components/LoadingScreen/LoadingScreen";
import ModalPortal from "../../../shared/components/ModalPortal/ModalPortal";
import InfoModal from "../../../shared/components/InfoModal/InfoModal";
import NotFoundView from "../../../shared/components/NotFoundView/NotFoundView";
import { FormContainer } from "../../../shared/components/FormContainer/FormContainer";
import { TextInput } from "../../../shared/components/TextInput/TextInput";
import { SelectInput } from "../../../shared/components/SelectInput/SelectInput";
import { useToast } from "../../../shared/Hooks/useToast";
import { formatCurrency } from "../../../shared/utils/formatCurrency";
import { useContacts } from "../../../features/contacts/hooks";
import { useLoansQuery } from "../../../features/loans/hooks";
import {
    useContactPlans,
    useCreateContactPlan,
    useDebtInstallments,
    useLoanPlans,
} from "../../../features/loans/debtHooks";
import { ActiveDebtCard } from "../../../features/debts/components/ActiveDebtCard";
import LoanForm from "../../../features/loans/components/CreateLoanForm/loanForm";
import { QuickPayForm } from "../../../features/LoanPayments/QuickPay";
import { ContactPlanModal } from "../../../features/loans/components/ContactPlanModal/ContactPlanModal";
import { LoanPlanModal } from "../../../features/loans/components/LoanPlanModal/LoanPlanModal";
import { EditLoanForm } from "../../../features/loans/components/EditLoanForm/EditLoanForm";
import { ForgiveLoanModal } from "../../../features/loans/components/ForgiveLoanModal/ForgiveLoanModal";
import { PayInstallmentModal } from "../../../features/loans/components/PayInstallmentModal/PayInstallmentModal";
import type { Loan } from "../../../features/loans/types";
import type { ContactPlanInput, CreateLoanPlanInput, DebtInstallmentItem } from "../../../features/loans/planTypes";
import "./ContactDebtPage.css";

dayjs.locale("es");

const getInitials = (name: string) =>
    name
        .split(" ")
        .filter(Boolean)
        .map((part) => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();

const PLAN_STATUS: Record<string, string> = {
    ACTIVE: "Activo",
    PAUSED: "Pausado",
    COMPLETED: "Completado",
    CANCELLED: "Cancelado",
};

export default function ContactDebtPage() {
    const { contactId = "" } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const { contacts, loading: contactsLoading, updateContact, mergeContacts } = useContacts();
    const {
        loans,
        isLoading: loansLoading,
        createLoan,
        updateLoan,
        cancelLoan,
        forgiveLoan,
    } = useLoansQuery({ contactId, status: "PENDING", limit: 9999 });
    const { plans } = useContactPlans(contactId);
    const { installments, payInstallment } = useDebtInstallments(dayjs().format("YYYY-MM"));
    const createContactPlan = useCreateContactPlan();
    const { createPlan } = useLoanPlans();

    const [showQuickPay, setShowQuickPay] = useState(false);
    const [showLoanForm, setShowLoanForm] = useState(false);
    const [showContactPlan, setShowContactPlan] = useState(false);
    const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
    const [planningLoan, setPlanningLoan] = useState<Loan | null>(null);
    const [forgivingLoan, setForgivingLoan] = useState<Loan | null>(null);
    const [pendingCancel, setPendingCancel] = useState<Loan | null>(null);
    const [payingInstallment, setPayingInstallment] = useState<DebtInstallmentItem | null>(null);
    const [editingContact, setEditingContact] = useState(false);
    const [mergingContact, setMergingContact] = useState(false);
    const [showAllActivity, setShowAllActivity] = useState(false);
    const [contactName, setContactName] = useState("");
    const [contactNotes, setContactNotes] = useState("");
    const [mergeTarget, setMergeTarget] = useState("");
    const [contactError, setContactError] = useState<string | null>(null);

    const contact = useMemo(
        () => contacts.find((item) => item.id === contactId),
        [contacts, contactId]
    );

    const contactInstallments = useMemo(
        () => installments.filter((item) => item.contact?.id === contactId),
        [installments, contactId]
    );

    const totals = useMemo(() => {
        let given = 0;
        let received = 0;
        let totalAmount = 0;
        let totalPaid = 0;
        let overdue = 0;

        for (const loan of loans) {
            if (loan.type === "GIVEN") given += loan.amountRemaining;
            else received += loan.amountRemaining;
            totalAmount += loan.principalAmount;
            totalPaid += loan.amountPaid;
            if (loan.status === "OVERDUE") overdue += 1;
        }

        const pendingDates = contactInstallments
            .filter((item) => item.status === "PENDING" || item.status === "PARTIAL" || item.status === "OVERDUE")
            .map((item) => item.dueDate)
            .filter((date): date is string => Boolean(date))
            .sort();

        return {
            given,
            received,
            net: given - received,
            totalAmount,
            totalPaid,
            overdue,
            nextDueDate: pendingDates[0] ?? null,
        };
    }, [loans, contactInstallments]);

    const payments = useMemo(
        () =>
            loans
                .flatMap((loan) =>
                    (loan.payments ?? []).map((payment) => ({
                        ...payment,
                        loanType: loan.type,
                        loanLender: loan.lender,
                        loanLabel:
                            loan.description ||
                            loan.transaction?.description ||
                            `Préstamo ${loan.type === "GIVEN" ? "a" : "de"} ${loan.lender}`,
                    }))
                )
                .sort((a, b) => b.date.localeCompare(a.date)),
        [loans]
    );

    const visiblePayments = showAllActivity ? payments : payments.slice(0, 8);

    if (!contactId) return <NotFoundView />;
    if (contactsLoading || loansLoading) {
        return <LoadingScreen message="Cargando la ficha de la persona..." />;
    }
    if (!contact && loans.length === 0) return <NotFoundView />;

    const displayName = contact?.name ?? loans[0]?.lender ?? "Contacto";
    const notes = contact?.notes;
    const net = totals.net;
    const planDirection: "GIVEN" | "RECEIVED" =
        totals.received > totals.given ? "RECEIVED" : "GIVEN";
    const planTotal = planDirection === "GIVEN" ? totals.given : totals.received;
    const progress = totals.totalAmount > 0
        ? Math.min(100, Math.max(0, Math.round((totals.totalPaid / totals.totalAmount) * 100)))
        : 0;

    const openContactEdit = () => {
        if (!contact) return;
        setContactName(contact.name);
        setContactNotes(contact.notes ?? "");
        setContactError(null);
        setEditingContact(true);
    };

    const submitContactEdit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!contact) return;
        if (contactName.trim().length < 3) {
            setContactError("El nombre debe tener al menos 3 caracteres");
            return;
        }
        try {
            await updateContact.mutateAsync({
                id: contact.id,
                data: { name: contactName.trim(), notes: contactNotes.trim() || null },
            });
            toast.success("Contacto actualizado");
            setEditingContact(false);
        } catch (error) {
            setContactError(error instanceof Error ? error.message : "No se pudo actualizar el contacto");
        }
    };

    const submitMerge = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!contact || !mergeTarget) {
            setContactError("Selecciona un contacto destino");
            return;
        }
        try {
            await mergeContacts.mutateAsync({ id: contact.id, targetContactId: mergeTarget });
            toast.success("Contacto fusionado");
            setMergingContact(false);
            navigate(`/debts/${mergeTarget}`);
        } catch (error) {
            setContactError(error instanceof Error ? error.message : "No se pudieron fusionar los contactos");
        }
    };

    const handleEditLoan = async (data: {
        contactId?: string;
        notes?: string | null;
        startDate?: string;
        principalAmount?: number;
        reason?: string;
    }) => {
        if (!editingLoan) return;
        try {
            await updateLoan.mutateAsync({ id: editingLoan.id, data });
            toast.success("Préstamo actualizado");
            setEditingLoan(null);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "No se pudo actualizar el préstamo");
        }
    };

    const handleForgiveLoan = async (data: { amount: number; reason?: string }) => {
        if (!forgivingLoan) return;
        try {
            await forgiveLoan.mutateAsync({ id: forgivingLoan.id, data });
            toast.success("Saldo condonado");
            setForgivingLoan(null);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "No se pudo condonar el saldo");
        }
    };

    const handleCreatePlan = async (data: CreateLoanPlanInput) => {
        if (!planningLoan) return;
        try {
            await createPlan.mutateAsync({ loanId: planningLoan.id, data });
            toast.success("Plan de cuotas creado");
            setPlanningLoan(null);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "No se pudo crear el plan");
        }
    };

    const handleCreateContactPlan = async (data: ContactPlanInput) => {
        if (!contact) return;
        try {
            await createContactPlan.mutateAsync({ contactId: contact.id, data });
            toast.success("Plan de cuotas creado");
            setShowContactPlan(false);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "No se pudo crear el plan");
        }
    };

    const handleCancelLoan = () => {
        if (!pendingCancel) return;
        cancelLoan.mutate(
            { id: pendingCancel.id, reason: "Cancelado por el usuario" },
            {
                onSuccess: () => {
                    toast.success("Préstamo cancelado");
                    setPendingCancel(null);
                },
                onError: (error) => toast.error(error.message || "No se pudo cancelar el préstamo"),
            }
        );
    };

    return (
        <div className="page-container contact-debt-page">
            <header className="contact-debt-hero card">
                <div className="contact-debt-hero__identity">
                    <span className="contact-debt-hero__avatar">{getInitials(displayName)}</span>
                    <div>
                        <span className="contact-debt-hero__eyebrow">Ficha de persona</span>
                        <h1>{displayName}</h1>
                        <p className="text-muted">
                            {loans.length} préstamo{loans.length === 1 ? "" : "s"} activo{loans.length === 1 ? "" : "s"}
                            {" · "}
                            {formatCurrency(totals.totalAmount)} registrado en total
                        </p>
                        {notes && <small className="contact-debt-hero__notes">{notes}</small>}
                    </div>
                </div>

                <div className={`contact-debt-hero__net ${net >= 0 ? "is-positive" : "is-negative"}`}>
                    <small>{net >= 0 ? "A favor" : "Por pagar"}</small>
                    <strong className="amount-font">{formatCurrency(Math.abs(net))}</strong>
                    <span>{progress}% pagado</span>
                </div>

                <div className="contact-debt-hero__actions">
                    <button type="button" className="btn-primary" onClick={() => setShowQuickPay(true)}>
                        <Wallet size={16} /> Pago rápido
                    </button>
                    <button type="button" className="btn-secondary" onClick={() => setShowLoanForm(true)}>
                        <Plus size={16} /> Nuevo préstamo
                    </button>
                    {(totals.given > 0 || totals.received > 0) && (
                        <button type="button" className="btn-secondary" onClick={() => setShowContactPlan(true)}>
                            <CalendarClock size={15} /> Plan de cuotas
                        </button>
                    )}
                    {contact && (
                        <>
                            <button type="button" className="btn-secondary" onClick={openContactEdit}>
                                <Pencil size={15} /> Editar
                            </button>
                            <button
                                type="button"
                                className="btn-ghost"
                                onClick={() => {
                                    setMergeTarget("");
                                    setContactError(null);
                                    setMergingContact(true);
                                }}
                            >
                                <Merge size={15} /> Fusionar
                            </button>
                        </>
                    )}
                </div>
            </header>

            <section className="contact-debt-stats">
                <article className="contact-debt-stat card is-given">
                    <span><ArrowUpRight size={17} /></span>
                    <div>
                        <small>Me deben</small>
                        <strong className="amount-font text-success">{formatCurrency(totals.given)}</strong>
                    </div>
                </article>
                <article className="contact-debt-stat card is-received">
                    <span><ArrowDownLeft size={17} /></span>
                    <div>
                        <small>Yo debo</small>
                        <strong className="amount-font text-danger">{formatCurrency(totals.received)}</strong>
                    </div>
                </article>
                <article className="contact-debt-stat card is-due">
                    <span><CalendarClock size={17} /></span>
                    <div>
                        <small>Próximo vencimiento</small>
                        <strong className="amount-font">
                            {totals.nextDueDate ? dayjs(totals.nextDueDate).format("D MMM") : "—"}
                        </strong>
                    </div>
                </article>
                <article className={`contact-debt-stat card is-overdue ${totals.overdue > 0 ? "has-risk" : ""}`}>
                    <span><AlertTriangle size={17} /></span>
                    <div>
                        <small>Préstamos vencidos</small>
                        <strong className={`amount-font ${totals.overdue > 0 ? "text-danger" : ""}`}>{totals.overdue}</strong>
                    </div>
                </article>
            </section>

            {plans.length > 0 && (
                <section className="card contact-debt-panel">
                    <div className="contact-debt-panel__head">
                        <div>
                            <h2><CalendarClock size={16} /> Planes de cuotas</h2>
                            <p className="text-muted">Cronogramas activos vinculados a esta persona.</p>
                        </div>
                        <button type="button" className="btn-ghost" onClick={() => setShowContactPlan(true)}>
                            Gestionar planes <ArrowRight size={14} />
                        </button>
                    </div>
                    <div className="contact-debt-plans">
                        {plans.map((plan) => {
                            const paid = (plan.installments ?? []).filter((item) => item.status === "PAID").length;
                            const total = plan.installmentCount;
                            const planProgress = total > 0 ? Math.round((paid / total) * 100) : 0;
                            return (
                                <article key={plan.id} className={`contact-debt-plan is-${plan.status.toLowerCase()}`}>
                                    <div className="contact-debt-plan__head">
                                        <span className={`contact-debt-plan__status is-${plan.status.toLowerCase()}`}>
                                            {PLAN_STATUS[plan.status] ?? plan.status}
                                        </span>
                                        <strong>{plan.direction === "GIVEN" ? "Me deben" : "Yo debo"}</strong>
                                        <small>{formatCurrency(plan.amountPerInstallment)} × {plan.installmentCount}</small>
                                    </div>
                                    <div className="contact-debt-plan__bar">
                                        <span style={{ width: `${planProgress}%` }} />
                                    </div>
                                    <div className="contact-debt-plan__meta">
                                        <span>{paid}/{total} cuotas pagadas</span>
                                        <span>{planProgress}%</span>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                </section>
            )}

            <div className="contact-debt-grid">
                <section className="contact-debt-debts">
                    <div className="contact-debt-panel__head">
                        <div>
                            <h2><HandCoins size={16} /> Deudas activas</h2>
                            <p className="text-muted">Cada préstamo con su progreso, próxima cuota y acciones.</p>
                        </div>
                    </div>
                    {loans.length === 0 ? (
                        <div className="empty-state card">
                            <p className="text-muted">Esta persona no tiene deudas activas.</p>
                            <button type="button" className="btn-primary" onClick={() => setShowLoanForm(true)}>
                                Registrar préstamo
                            </button>
                        </div>
                    ) : (
                        <div className="contact-debt-list">
                            {loans.map((loan) => (
                                <ActiveDebtCard
                                    key={loan.id}
                                    loan={loan}
                                    installments={contactInstallments}
                                    onEdit={(item) => setEditingLoan(item)}
                                    onPlan={(item) => setPlanningLoan(item)}
                                    onForgive={(item) => setForgivingLoan(item)}
                                    onCancel={(item) => setPendingCancel(item)}
                                />
                            ))}
                        </div>
                    )}
                </section>

                <aside className="contact-debt-side">
                    <section className="card contact-debt-panel">
                        <div className="contact-debt-panel__head">
                            <div>
                                <h2><CalendarClock size={16} /> Cuotas próximas</h2>
                                <p className="text-muted">Vencimientos de este mes.</p>
                            </div>
                        </div>
                        {contactInstallments.length === 0 ? (
                            <p className="contact-debt-empty">Sin cuotas programadas este mes.</p>
                        ) : (
                            <ul className="contact-debt-installments">
                                {contactInstallments.slice(0, 6).map((installment) => (
                                    <li key={installment.id}>
                                        <span className={`contact-debt-installment__dot is-${installment.status.toLowerCase()}`} />
                                        <div>
                                            <strong>Cuota {installment.sequence}</strong>
                                            <small>
                                                {installment.dueDate ? dayjs(installment.dueDate).format("D MMM") : "Sin fecha"}
                                                {" · "}
                                                {installment.status === "PAID" ? "Pagada" : formatCurrency(installment.remaining)}
                                            </small>
                                        </div>
                                        {installment.status !== "PAID" && installment.status !== "CANCELLED" && (
                                            <button
                                                type="button"
                                                className="btn-ghost"
                                                onClick={() => setPayingInstallment(installment)}
                                            >
                                                Pagar
                                            </button>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>

                    <section className="card contact-debt-panel">
                        <div className="contact-debt-panel__head">
                            <div>
                                <h2><History size={16} /> Actividad reciente</h2>
                                <p className="text-muted">Últimos pagos registrados.</p>
                            </div>
                        </div>
                        {payments.length === 0 ? (
                            <p className="contact-debt-empty">Sin pagos registrados.</p>
                        ) : (
                            <>
                                <ul className="contact-debt-activity">
                                    {visiblePayments.map((payment) => {
                                        const isGiven = payment.loanType === "GIVEN";
                                        return (
                                            <li key={payment.id}>
                                                <span>{dayjs(payment.date).format("D MMM")}</span>
                                                <div>
                                                    <strong>{payment.description ?? "Pago a préstamo"}</strong>
                                                    <small>
                                                        {payment.loanLabel} · Pago a préstamo
                                                    </small>
                                                </div>
                                                <strong className={isGiven ? "text-success" : "text-danger"}>
                                                    {isGiven ? "+" : "−"} {formatCurrency(payment.amount)}
                                                </strong>
                                            </li>
                                        );
                                    })}
                                </ul>
                                {payments.length > 8 && (
                                    <button
                                        type="button"
                                        className="contact-debt-activity__toggle"
                                        onClick={() => setShowAllActivity((value) => !value)}
                                    >
                                        {showAllActivity
                                            ? "Mostrar menos"
                                            : `Ver toda la actividad (${payments.length})`}
                                        <ChevronDown size={14} className={showAllActivity ? "is-open" : ""} />
                                    </button>
                                )}
                            </>
                        )}
                    </section>
                </aside>
            </div>

            <ModalPortal isOpen={showQuickPay} onClose={() => setShowQuickPay(false)}>
                <QuickPayForm lender={displayName} onClose={() => setShowQuickPay(false)} />
            </ModalPortal>

            <ModalPortal isOpen={showLoanForm} onClose={() => setShowLoanForm(false)}>
                <LoanForm
                    mutation={createLoan}
                    lenders={contacts.map((item) => item.name)}
                    initialData={{ lender: displayName }}
                    onSuccess={() => setShowLoanForm(false)}
                    onClose={() => setShowLoanForm(false)}
                />
            </ModalPortal>

            <ModalPortal isOpen={showContactPlan} onClose={() => setShowContactPlan(false)}>
                {contact && (
                    <ContactPlanModal
                        contactId={contact.id}
                        contactName={contact.name}
                        totalDebt={planTotal}
                        direction={planDirection}
                        isPending={createContactPlan.isPending}
                        onSubmit={handleCreateContactPlan}
                        onClose={() => setShowContactPlan(false)}
                    />
                )}
            </ModalPortal>

            <ModalPortal isOpen={!!planningLoan} onClose={() => setPlanningLoan(null)}>
                {planningLoan && (
                    <LoanPlanModal
                        loan={planningLoan}
                        isPending={createPlan.isPending}
                        onSubmit={handleCreatePlan}
                        onClose={() => setPlanningLoan(null)}
                    />
                )}
            </ModalPortal>

            <ModalPortal isOpen={!!editingLoan} onClose={() => setEditingLoan(null)}>
                {editingLoan && (
                    <EditLoanForm
                        loan={editingLoan}
                        isPending={updateLoan.isPending}
                        onSubmit={handleEditLoan}
                        onClose={() => setEditingLoan(null)}
                    />
                )}
            </ModalPortal>

            <ModalPortal isOpen={!!forgivingLoan} onClose={() => setForgivingLoan(null)}>
                {forgivingLoan && (
                    <ForgiveLoanModal
                        loan={forgivingLoan}
                        isPending={forgiveLoan.isPending}
                        onSubmit={handleForgiveLoan}
                        onClose={() => setForgivingLoan(null)}
                    />
                )}
            </ModalPortal>

            <ModalPortal isOpen={!!payingInstallment} onClose={() => setPayingInstallment(null)}>
                {payingInstallment && (
                    <PayInstallmentModal
                        installment={payingInstallment}
                        isPending={payInstallment.isPending}
                        onSubmit={async ({ amount, accountId, note }) => {
                            try {
                                await payInstallment.mutateAsync({
                                    id: payingInstallment.id,
                                    data: {
                                        amount,
                                        accountId,
                                        date: dayjs().format("YYYY-MM-DD"),
                                        description: note,
                                    },
                                });
                                toast.success("Cuota pagada");
                                setPayingInstallment(null);
                            } catch (error) {
                                toast.error(error instanceof Error ? error.message : "No se pudo pagar la cuota");
                            }
                        }}
                        onClose={() => setPayingInstallment(null)}
                    />
                )}
            </ModalPortal>

            <ModalPortal isOpen={editingContact} onClose={() => setEditingContact(false)}>
                <FormContainer title="Editar contacto" icon={<Pencil size={20} />} error={contactError} className="max-w-lg mx-auto" onClose={() => setEditingContact(false)}>
                    <form className="form-default-container" onSubmit={submitContactEdit}>
                        <TextInput label="Nombre" icon="User" value={contactName} onChange={setContactName} disabled={updateContact.isPending} required />
                        <TextInput label="Notas" icon="AlignLeft" value={contactNotes} onChange={setContactNotes} textarea disabled={updateContact.isPending} />
                        <div className="form-actions-container">
                            <button type="submit" className="btn-submit" disabled={updateContact.isPending}>
                                <CheckCircle2 size={15} /> Guardar contacto
                            </button>
                        </div>
                    </form>
                </FormContainer>
            </ModalPortal>

            <ModalPortal isOpen={mergingContact} onClose={() => setMergingContact(false)}>
                <FormContainer title="Fusionar contactos" icon={<Merge size={20} />} error={contactError} className="max-w-lg mx-auto" onClose={() => setMergingContact(false)}>
                    <form className="form-default-container" onSubmit={submitMerge}>
                        <p className="text-muted">
                            Todo el historial de <strong>{displayName}</strong> pasará al contacto destino.
                        </p>
                        <SelectInput
                            label="Contacto destino"
                            icon="Users"
                            value={mergeTarget}
                            onChange={setMergeTarget}
                            options={contacts.filter((item) => item.id !== contactId).map((item) => ({ value: item.id, label: item.name }))}
                            disabled={mergeContacts.isPending}
                            required
                        />
                        <div className="form-actions-container">
                            <button type="submit" className="btn-submit" disabled={mergeContacts.isPending || !mergeTarget}>
                                <Merge size={15} /> Fusionar
                            </button>
                        </div>
                    </form>
                </FormContainer>
            </ModalPortal>

            <InfoModal
                isOpen={!!pendingCancel}
                onClose={() => setPendingCancel(null)}
                onConfirm={handleCancelLoan}
                type="error"
                title="Cancelar préstamo"
                message={`¿Cancelar el préstamo con ${displayName}? Se conservarán los movimientos históricos.`}
                confirmText={cancelLoan.isPending ? "Cancelando..." : "Cancelar préstamo"}
                cancelText="Volver"
                confirmDisabled={cancelLoan.isPending}
            />
        </div>
    );
}
