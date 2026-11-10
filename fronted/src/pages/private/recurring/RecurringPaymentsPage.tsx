import { useMemo, useState } from "react";
import dayjs from "dayjs";
import "dayjs/locale/es";
import {
    ArrowDownLeft,
    ArrowUpRight,
    Bell,
    CalendarClock,
    CheckCircle2,
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
import {
    usePaymentNotifications,
    useRecurringPayments,
    useRecurringProjection,
} from "../../../features/recurring/hooks";
import type {
    RecurringOccurrence,
    RecurringPayment,
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

function scheduleLabel(payment: RecurringPayment) {
    const every = payment.intervalCount > 1 ? `cada ${payment.intervalCount} ` : "";
    if (payment.frequency === "MONTHLY") {
        return `${every ? every + "meses" : "Cada mes"} · día ${payment.dayOfMonth ?? "—"}`;
    }
    if (payment.frequency === "YEARLY") {
        return `${every ? every + "años" : "Cada año"} · día ${payment.dayOfMonth ?? "—"}`;
    }
    return `${every ? every + "semanas" : payment.frequency === "WEEKLY" ? "Cada semana" : "Cada 2 semanas"}`;
}

export default function RecurringPaymentsPage() {
    const [month, setMonth] = useState(() => dayjs().format("YYYY-MM"));
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<RecurringPayment | null>(null);
    const [pendingDelete, setPendingDelete] = useState<RecurringPayment | null>(null);
    const toast = useToast();

    const { projection, loading } = useRecurringProjection(month);
    const {
        payments,
        createPayment,
        updatePayment,
        deletePayment,
        executeOccurrence,
        skipOccurrence,
        processDue,
    } = useRecurringPayments();
    const { notifications, unread, markRead, markAllRead } = usePaymentNotifications();

    const sortedOccurrences = useMemo(
        () => [...(projection?.occurrences ?? [])].sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
        [projection]
    );

    const submitPayment = async (data: RecurringPaymentFormOutput) => {
        try {
            if (editing) {
                await updatePayment.mutateAsync({ id: editing.id, data });
                toast.success("Pago previsto actualizado");
            } else {
                await createPayment.mutateAsync(data);
                toast.success("Pago previsto creado");
            }
            setShowForm(false);
            setEditing(null);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "No se pudo guardar el pago previsto");
        }
    };

    const handleExecute = async (occurrence: RecurringOccurrence) => {
        try {
            await executeOccurrence.mutateAsync({ id: occurrence.id });
            toast.success("Pago ejecutado");
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
                toast.success("Pago previsto eliminado");
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
                    <h1>Pagos previstos</h1>
                    <p className="text-muted">Anticipa tus gastos e ingresos recurrentes antes de que ocurran.</p>
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
                    <button className="btn-primary" onClick={() => setShowForm(true)}>
                        <Plus size={18} />
                        Nuevo pago previsto
                    </button>
                </div>
            </header>

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
                            <p>No hay pagos previstos para este mes.</p>
                            <button className="btn-secondary" onClick={() => setShowForm(true)}>Crear el primero</button>
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
                        <h2><Repeat size={17} /> Reglas configuradas</h2>
                        <span className="recurring-section-count">{payments.length}</span>
                    </div>

                    {payments.length === 0 ? (
                        <p className="recurring-empty-text">Aún no tienes reglas recurrentes.</p>
                    ) : (
                        <div className="recurring-rule-list">
                            {payments.map((payment) => (
                                <article key={payment.id} className={`recurring-rule ${!payment.isActive ? "is-paused" : ""}`}>
                                    <div className="recurring-rule__main">
                                        <strong>{payment.name}</strong>
                                        <span>{scheduleLabel(payment)}</span>
                                        <small>
                                            {payment.autoDebit ? "Débito automático" : "Confirmación manual"}
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
                                            onClick={() => { setEditing(payment); setShowForm(true); }}
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

            <ModalPortal isOpen={showForm} onClose={() => { setShowForm(false); setEditing(null); }}>
                <RecurringPaymentForm
                    payment={editing ?? undefined}
                    isPending={createPayment.isPending || updatePayment.isPending}
                    onSubmit={submitPayment}
                    onClose={() => { setShowForm(false); setEditing(null); }}
                />
            </ModalPortal>

            <InfoModal
                isOpen={!!pendingDelete}
                onClose={() => setPendingDelete(null)}
                onConfirm={handleDelete}
                type="error"
                title="Eliminar pago previsto"
                message={`¿Eliminar "${pendingDelete?.name}" y sus ocurrencias pendientes?`}
                confirmText={deletePayment.isPending ? "Eliminando…" : "Eliminar"}
                cancelText="Cancelar"
                confirmDisabled={deletePayment.isPending}
            />
        </div>
    );
}
