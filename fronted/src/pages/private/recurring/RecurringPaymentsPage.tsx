import { useMemo, useState } from "react";
import dayjs from "dayjs";
import "dayjs/locale/es";
import {
    ArrowDownLeft,
    ArrowUpRight,
    Bell,
    CalendarClock,
    CheckCircle2,
    HandCoins,
    Pause,
    Pencil,
    Play,
    Plus,
    Repeat,
    Trash2,
    Wallet,
} from "lucide-react";
import LoadingScreen from "../../../shared/components/LoadingScreen/LoadingScreen";
import ModalPortal from "../../../shared/components/ModalPortal/ModalPortal";
import InfoModal from "../../../shared/components/InfoModal/InfoModal";
import { SelectInput } from "../../../shared/components/SelectInput/SelectInput";
import { useToast } from "../../../shared/Hooks/useToast";
import { formatCurrency } from "../../../shared/utils/formatCurrency";
import { RecurringPaymentForm } from "../../../features/recurring/components/RecurringPaymentForm";
import { useLoansQuery } from "../../../features/loans/hooks";
import {
    usePaymentNotifications,
    useRecurringPayments,
    useRecurringProjection,
} from "../../../features/recurring/hooks";
import type {
    RecurringOccurrence,
    RecurringPayment,
    RecurringPaymentFormInput,
    RecurringPaymentFormOutput,
} from "../../../features/recurring/types";
import "./RecurringPaymentsPage.css";

dayjs.locale("es");

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, index) => {
    const month = dayjs().subtract(index, "month");
    return { value: month.format("YYYY-MM"), label: month.format("MMMM YYYY") };
});

const STATUS_LABEL: Record<RecurringOccurrence["status"], string> = {
    PENDING: "Programado",
    DUE: "Vence hoy",
    PAID: "Pagado",
    SKIPPED: "Omitido",
    FAILED: "Falló",
};

function loanActionLabel(action: RecurringPayment["loanAction"]) {
    if (action === "PAY_LOAN") return "Pagar préstamo";
    if (action === "GIVE_LOAN") return "Prestar";
    if (action === "RECEIVE_LOAN") return "Cobrar préstamo";
    return null;
}

function scheduleLabel(payment: RecurringPayment) {
    if (payment.frequency === "ONCE") {
        return `Pago único · ${dayjs(payment.startDate).format("D MMM YYYY")}`;
    }
    if (payment.frequency === "FIFTEEN_DAYS") {
        const base = payment.intervalCount > 1 ? `Cada ${payment.intervalCount * 15} días` : "Cada 15 días";
        return payment.maxOccurrences ? `${base} · ${payment.maxOccurrences} cuotas` : base;
    }
    const every = payment.intervalCount > 1 ? `cada ${payment.intervalCount} ` : "";
    const limit = payment.maxOccurrences ? ` · ${payment.maxOccurrences} pagos` : "";
    if (payment.frequency === "MONTHLY") {
        return `${every ? every + "meses" : "Cada mes"} · día ${payment.dayOfMonth ?? "—"}${limit}`;
    }
    if (payment.frequency === "YEARLY") {
        return `${every ? every + "años" : "Cada año"} · día ${payment.dayOfMonth ?? "—"}${limit}`;
    }
    return `${every ? every + "semanas" : payment.frequency === "WEEKLY" ? "Cada semana" : "Cada 2 semanas"}${limit}`;
}

export default function RecurringPaymentsPage() {
    const [month, setMonth] = useState(() => dayjs().format("YYYY-MM"));
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<RecurringPayment | null>(null);
    const [formDefaults, setFormDefaults] = useState<Partial<RecurringPaymentFormInput>>();
    const [pendingDelete, setPendingDelete] = useState<RecurringPayment | null>(null);
    const toast = useToast();

    const { projection, loading, refetch: refetchProjection } = useRecurringProjection(month);
    const {
        payments,
        createPayment,
        updatePayment,
        deletePayment,
        executeOccurrence,
        skipOccurrence,
        processDue,
        refetch: refetchPayments,
    } = useRecurringPayments();
    const { notifications, unread, markRead, markAllRead } = usePaymentNotifications();
    const { loans } = useLoansQuery({ status: "PENDING", limit: 100 });

    const debtGroups = useMemo(() => {
        const map = new Map<string, { lender: string; given: number; received: number; count: number }>();
        for (const loan of loans) {
            const remaining = loan.amountRemaining ?? 0;
            if (remaining <= 0) continue;
            const current = map.get(loan.lender) ?? { lender: loan.lender, given: 0, received: 0, count: 0 };
            if (loan.type === "GIVEN") current.given += remaining;
            else current.received += remaining;
            current.count += 1;
            map.set(loan.lender, current);
        }
        return [...map.values()]
            .filter((item) => item.given > 0 || item.received > 0)
            .sort((a, b) => (b.given + b.received) - (a.given + a.received));
    }, [loans]);

    const openNew = (defaults?: Partial<RecurringPaymentFormInput>) => {
        setEditing(null);
        setFormDefaults(defaults);
        setShowForm(true);
    };

    const openEdit = (payment: RecurringPayment) => {
        setEditing(payment);
        setFormDefaults(undefined);
        setShowForm(true);
    };

    const closeForm = () => {
        setShowForm(false);
        setEditing(null);
        setFormDefaults(undefined);
    };

    const sortedOccurrences = useMemo(
        () => [...(projection?.occurrences ?? [])].sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
        [projection]
    );

    const submitPayment = async (data: RecurringPaymentFormOutput) => {
        try {
            if (editing) {
                await updatePayment.mutateAsync({ id: editing.id, data });
                toast.success("Pago futuro actualizado");
            } else {
                await createPayment.mutateAsync(data);
                toast.success("Pago futuro creado");
            }
            closeForm();
            await Promise.all([refetchProjection(), refetchPayments()]);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "No se pudo guardar el pago futuro");
        }
    };

    const handleExecute = async (occurrence: RecurringOccurrence) => {
        try {
            await executeOccurrence.mutateAsync({ id: occurrence.id });
            toast.success(
                occurrence.loanAction === "PAY_LOAN"
                    ? "Pago del préstamo registrado"
                    : occurrence.loanAction === "GIVE_LOAN" || occurrence.loanAction === "RECEIVE_LOAN"
                        ? "Préstamo registrado"
                        : "Pago ejecutado"
            );
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "No se pudo ejecutar el pago");
        }
    };

    const handleSkip = async (occurrence: RecurringOccurrence) => {
        try {
            await skipOccurrence.mutateAsync({ id: occurrence.id });
            toast.success("Pago omitido");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "No se pudo omitir el pago");
        }
    };

    const handleToggleActive = async (payment: RecurringPayment) => {
        try {
            await updatePayment.mutateAsync({ id: payment.id, data: { isActive: !payment.isActive } });
            toast.success(payment.isActive ? "Pago pausado" : "Pago reactivado");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "No se pudo actualizar el pago");
        }
    };

    const handleDelete = () => {
        if (!pendingDelete) return;
        deletePayment.mutate(pendingDelete.id, {
            onSuccess: () => {
                setPendingDelete(null);
                toast.success("Pago futuro eliminado");
            },
            onError: (error) => toast.error(error.message || "No se pudo eliminar el pago"),
        });
    };

    const handleProcessDue = async () => {
        try {
            const result = await processDue.mutateAsync();
            toast.success(`Procesados ${result.processed} pagos automáticos`);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "No se pudieron procesar los vencimientos");
        }
    };

    if (loading && !projection) return <LoadingScreen message="Calculando flujo previsto..." />;

    const netClass = (projection?.projectedNet ?? 0) >= 0 ? "text-success" : "text-danger";

    return (
        <div className="page-container recurring-page">
            <header className="recurring-header card">
                <div className="recurring-header__text">
                    <span className="recurring-header__eyebrow">Flujo de caja proyectado</span>
                    <h1>Pagos futuros</h1>
                    <p className="text-muted">
                        Anticipa gastos e ingresos, pagos de préstamos o dinero que planeas prestar.
                    </p>
                </div>

                <div className="recurring-header__actions">
                    <SelectInput
                        compact
                        label="Mes"
                        hideLabel
                        value={month}
                        onChange={setMonth}
                        options={MONTH_OPTIONS}
                        className="recurring-month-select"
                    />
                    <button className="btn-secondary" onClick={handleProcessDue} disabled={processDue.isPending}>
                        <Repeat size={16} />
                        Procesar vencidos
                    </button>
                    <button className="btn-primary" onClick={() => openNew()}>
                        <Plus size={18} />
                        Nuevo pago futuro
                    </button>
                </div>
            </header>

            <section className="recurring-quick card" aria-label="Plantillas de pagos futuros">
                <div className="recurring-quick__intro">
                    <strong>Planifica en segundos</strong>
                    <span>Elige una plantilla y solo completa el monto y la fecha.</span>
                </div>
                <div className="recurring-quick__grid">
                    <button
                        type="button"
                        className="recurring-quick__item"
                        onClick={() => openNew({ type: "EXPENSE", frequency: "ONCE", name: "Pago de préstamo", autoDebit: false })}
                    >
                        <span>Pago de préstamo</span>
                        <small>Cuota o abono que harás este mes</small>
                    </button>
                    <button
                        type="button"
                        className="recurring-quick__item"
                        onClick={() => openNew({ type: "EXPENSE", frequency: "ONCE", name: "Préstamo a ", autoDebit: false })}
                    >
                        <span>Prestar a alguien</span>
                        <small>Dinero que planeas entregar</small>
                    </button>
                    <button
                        type="button"
                        className="recurring-quick__item"
                        onClick={() => openNew({ type: "INCOME", frequency: "ONCE", name: "Cobro de préstamo", autoDebit: false })}
                    >
                        <span>Cobrar préstamo</span>
                        <small>Devolución que esperas recibir</small>
                    </button>
                    <button
                        type="button"
                        className="recurring-quick__item"
                        onClick={() => openNew({ type: "EXPENSE", frequency: "ONCE", autoDebit: false })}
                    >
                        <span>Otro pago único</span>
                        <small>Gasto o ingreso no recurrente</small>
                    </button>
                </div>
            </section>

            <section className="recurring-stats">
                <article className="recurring-stat card recurring-stat--income">
                    <span className="recurring-stat__icon"><ArrowDownLeft size={17} /></span>
                    <div>
                        <span>Ingresos esperados</span>
                        <strong className="amount-font">{formatCurrency(projection?.expectedIncome ?? 0)}</strong>
                        <small>Pendientes {formatCurrency(projection?.pendingIncome ?? 0)}</small>
                    </div>
                </article>

                <article className="recurring-stat card recurring-stat--expense">
                    <span className="recurring-stat__icon"><ArrowUpRight size={17} /></span>
                    <div>
                        <span>Gastos previstos</span>
                        <strong className="amount-font">{formatCurrency(projection?.expectedExpense ?? 0)}</strong>
                        <small>Pendientes {formatCurrency(projection?.pendingExpense ?? 0)}</small>
                    </div>
                </article>

                <article className="recurring-stat card recurring-stat--net">
                    <span className="recurring-stat__icon"><Wallet size={17} /></span>
                    <div>
                        <span>Neto proyectado</span>
                        <strong className={`amount-font ${netClass}`}>{formatCurrency(projection?.projectedNet ?? 0)}</strong>
                        <small>{projection?.dueCount ?? 0} vencen hoy</small>
                    </div>
                </article>
            </section>

            {debtGroups.length > 0 && (
                <section className="card recurring-debts" data-tour="loan-debts">
                    <div className="recurring-section-head">
                        <h2><HandCoins size={17} /> Deudas por persona</h2>
                        <span className="recurring-section-count">{debtGroups.length}</span>
                    </div>
                    <p className="recurring-debts__hint">
                        Sumamos todos los préstamos pendientes de cada persona. Puedes planificar el pago completo o en cuotas cada 15 días.
                    </p>
                    <div className="recurring-debts__grid">
                        {debtGroups.map((debt) => (
                            <article key={debt.lender} className="recurring-debt">
                                <div className="recurring-debt__head">
                                    <strong>{debt.lender}</strong>
                                    <small>{debt.count} préstamo{debt.count === 1 ? "" : "s"}</small>
                                </div>
                                {debt.received > 0 && (
                                    <div className="recurring-debt__row">
                                        <span>Yo debo</span>
                                        <strong className="text-danger">{formatCurrency(debt.received)}</strong>
                                        <button
                                            type="button"
                                            className="btn-secondary"
                                            onClick={() => openNew({
                                                type: "EXPENSE",
                                                frequency: "ONCE",
                                                name: `Pago a ${debt.lender}`,
                                                amount: String(debt.received),
                                                loanAction: "PAY_LOAN",
                                                loanCounterparty: debt.lender,
                                                autoDebit: false,
                                            })}
                                        >
                                            Planificar pago
                                        </button>
                                    </div>
                                )}
                                {debt.given > 0 && (
                                    <div className="recurring-debt__row">
                                        <span>Me deben</span>
                                        <strong className="text-success">{formatCurrency(debt.given)}</strong>
                                        <button
                                            type="button"
                                            className="btn-secondary"
                                            onClick={() => openNew({
                                                type: "INCOME",
                                                frequency: "ONCE",
                                                name: `Cobro de ${debt.lender}`,
                                                amount: String(debt.given),
                                                loanAction: "PAY_LOAN",
                                                loanCounterparty: debt.lender,
                                                autoDebit: false,
                                            })}
                                        >
                                            Planificar cobro
                                        </button>
                                    </div>
                                )}
                            </article>
                        ))}
                    </div>
                </section>
            )}

            {unread > 0 && (
                <section className="recurring-notifications card">
                    <div className="recurring-section-head">
                        <h2><Bell size={17} /> Notificaciones <span>{unread}</span></h2>
                        <button className="btn-ghost" onClick={() => markAllRead.mutate()}>Marcar todas</button>
                    </div>
                    <div className="recurring-notification-list">
                        {notifications.filter((notification) => !notification.readAt).slice(0, 3).map((notification) => (
                            <div key={notification.id} className="recurring-notification">
                                <div>
                                    <strong>{notification.title}</strong>
                                    <p>{notification.message}</p>
                                </div>
                                <button className="btn-ghost" onClick={() => markRead.mutate(notification.id)}>
                                    Marcar leída
                                </button>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            <div className="recurring-layout">
                <section className="card recurring-panel">
                    <div className="recurring-section-head">
                        <h2><CalendarClock size={17} /> Pagos del mes</h2>
                        <span className="recurring-section-count">{sortedOccurrences.length}</span>
                    </div>

                    {sortedOccurrences.length === 0 ? (
                        <div className="recurring-empty">
                            <CalendarClock size={22} />
                            <p>No hay pagos futuros para este mes.</p>
                            <button className="btn-secondary" onClick={() => openNew()}>Crear el primero</button>
                        </div>
                    ) : (
                        <div className="recurring-occurrences">
                            {sortedOccurrences.map((occurrence) => {
                                const isIncome = occurrence.type === "INCOME";
                                const isDone = occurrence.status === "PAID" || occurrence.status === "SKIPPED";
                                return (
                                    <article key={occurrence.id} className={`recurring-occurrence is-${occurrence.status.toLowerCase()}`}>
                                        <div className="recurring-occurrence__date">
                                            <span>{dayjs(occurrence.dueDate).format("D")}</span>
                                            <small>{dayjs(occurrence.dueDate).format("MMM")}</small>
                                        </div>

                                        <div className="recurring-occurrence__body">
                                            <div className="recurring-occurrence__title">
                                                <strong>{occurrence.name}</strong>
                                                <span className={`recurring-status is-${occurrence.status.toLowerCase()}`}>
                                                    {STATUS_LABEL[occurrence.status]}
                                                </span>
                                                {occurrence.autoDebit && <span className="recurring-auto"><Repeat size={11} /> Auto</span>}
                                                {occurrence.loanAction && occurrence.loanAction !== "NONE" && (
                                                    <span className="recurring-loan-badge">
                                                        {loanActionLabel(occurrence.loanAction)}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="recurring-occurrence__meta">
                                                <span>{occurrence.account?.name ?? "Sin cuenta"}</span>
                                                {occurrence.category && <><span>·</span><span>{occurrence.category.name}</span></>}
                                            </div>
                                        </div>

                                        <strong className={`recurring-occurrence__amount ${isIncome ? "text-success" : "text-danger"}`}>
                                            {isIncome ? "+" : "−"} {formatCurrency(occurrence.amount)}
                                        </strong>

                                        {!isDone && (
                                            <div className="recurring-occurrence__actions">
                                                <button className="btn-primary" onClick={() => handleExecute(occurrence)} disabled={executeOccurrence.isPending}>
                                                    <CheckCircle2 size={14} /> Confirmar
                                                </button>
                                                <button className="btn-secondary" onClick={() => handleSkip(occurrence)} disabled={skipOccurrence.isPending}>
                                                    Omitir
                                                </button>
                                            </div>
                                        )}
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </section>

                <aside className="card recurring-rules">
                    <div className="recurring-section-head">
                        <h2><Repeat size={17} /> Pagos configurados</h2>
                        <span className="recurring-section-count">{payments.length}</span>
                    </div>

                    {payments.length === 0 ? (
                        <p className="recurring-empty-text">Aún no tienes pagos futuros configurados.</p>
                    ) : (
                        <div className="recurring-rule-list">
                            {payments.map((payment) => (
                                <article key={payment.id} className={`recurring-rule ${!payment.isActive ? "is-paused" : ""}`}>
                                    <div className="recurring-rule__main">
                                        <strong>{payment.name}</strong>
                                        <span>{scheduleLabel(payment)}</span>
                                        <small>
                                            {payment.autoDebit ? "Débito automático" : "Confirmación manual"}
                                            {loanActionLabel(payment.loanAction) ? ` · ${loanActionLabel(payment.loanAction)}${payment.loan?.lender ? `: ${payment.loan.lender}` : payment.loanCounterparty ? `: ${payment.loanCounterparty}` : ""}` : ""}
                                            {payment.nextDueDate ? ` · próximo ${dayjs(payment.nextDueDate).format("D MMM")}` : ""}
                                        </small>
                                    </div>
                                    <strong className={`amount-font ${payment.type === "INCOME" ? "text-success" : "text-danger"}`}>
                                        {formatCurrency(payment.amount)}
                                    </strong>
                                    <div className="recurring-rule__actions">
                                        <button
                                            type="button"
                                            className="recurring-icon-btn"
                                            onClick={() => handleToggleActive(payment)}
                                            aria-label={payment.isActive ? "Pausar" : "Reactivar"}
                                            title={payment.isActive ? "Pausar" : "Reactivar"}
                                        >
                                            {payment.isActive ? <Pause size={14} /> : <Play size={14} />}
                                        </button>
                                        <button
                                            type="button"
                                            className="recurring-icon-btn"
                                            onClick={() => openEdit(payment)}
                                            aria-label="Editar"
                                            title="Editar"
                                        >
                                            <Pencil size={14} />
                                        </button>
                                        <button
                                            type="button"
                                            className="recurring-icon-btn danger"
                                            onClick={() => setPendingDelete(payment)}
                                            aria-label="Eliminar"
                                            title="Eliminar"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </aside>
            </div>

            <ModalPortal isOpen={showForm} onClose={closeForm}>
                <RecurringPaymentForm
                    payment={editing ?? undefined}
                    defaults={formDefaults}
                    isPending={createPayment.isPending || updatePayment.isPending}
                    onSubmit={submitPayment}
                    onClose={closeForm}
                />
            </ModalPortal>

            <InfoModal
                isOpen={!!pendingDelete}
                onClose={() => setPendingDelete(null)}
                onConfirm={handleDelete}
                type="error"
                title="Eliminar pago futuro"
                message={`¿Eliminar "${pendingDelete?.name}" y sus ocurrencias pendientes?`}
                confirmText={deletePayment.isPending ? "Eliminando…" : "Eliminar"}
                cancelText="Cancelar"
                confirmDisabled={deletePayment.isPending}
            />
        </div>
    );
}
