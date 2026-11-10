import { useState } from "react";
import dayjs from "dayjs";
import "dayjs/locale/es";
import { AlertTriangle, Pencil, PiggyBank, Plus, Trash2, Wallet } from "lucide-react";
import LoadingScreen from "../../../shared/components/LoadingScreen/LoadingScreen";
import ModalPortal from "../../../shared/components/ModalPortal/ModalPortal";
import InfoModal from "../../../shared/components/InfoModal/InfoModal";
import { SelectInput } from "../../../shared/components/SelectInput/SelectInput";
import { useToast } from "../../../shared/Hooks/useToast";
import { formatCurrency } from "../../../shared/utils/formatCurrency";
import { getIcon } from "../../../shared/utils/GetIcon";
import { useBudgets } from "../../../features/budgets/hooks";
import { BudgetForm } from "../../../features/budgets/components/BudgetForm";
import type { BudgetItem } from "../../../features/budgets/types";
import "./BudgetsPage.css";

dayjs.locale("es");

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, index) => {
    const month = dayjs().subtract(index, "month");
    return { value: month.format("YYYY-MM"), label: month.format("MMMM YYYY") };
});

export default function BudgetsPage() {
    const [month, setMonth] = useState(() => dayjs().format("YYYY-MM"));
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<BudgetItem | null>(null);
    const [pendingDelete, setPendingDelete] = useState<BudgetItem | null>(null);
    const toast = useToast();

    const { data, loading, upsertBudget, deleteBudget } = useBudgets(month);
    const budgets = data?.budgets ?? [];

    const handleSubmit = async ({ categoryId, amount }: { categoryId: string; amount: number }) => {
        try {
            await upsertBudget.mutateAsync({ categoryId, month, amount });
            toast.success(editing ? "Presupuesto actualizado" : "Presupuesto creado");
            setShowForm(false);
            setEditing(null);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "No se pudo guardar el presupuesto");
        }
    };

    const handleDelete = () => {
        if (!pendingDelete) return;
        deleteBudget.mutate(pendingDelete.id, {
            onSuccess: () => {
                setPendingDelete(null);
                toast.success("Presupuesto eliminado");
            },
            onError: (error) => toast.error(error.message || "No se pudo eliminar el presupuesto"),
        });
    };

    if (loading && !data) return <LoadingScreen message="Cargando presupuestos..." />;

    const totalRemaining = data?.totalRemaining ?? 0;

    return (
        <div className="page-container budgets-page">
            <header className="budgets-header card">
                <div>
                    <span className="budgets-header__eyebrow">Control de gastos</span>
                    <h1>Presupuestos</h1>
                    <p className="text-muted">Define límites por categoría y compara contra el gasto real del mes.</p>
                </div>

                <div className="budgets-header__actions">
                    <SelectInput
                        compact
                        label="Mes"
                        hideLabel
                        value={month}
                        onChange={setMonth}
                        options={MONTH_OPTIONS}
                        className="budgets-month-select"
                    />
                    <button className="btn-primary" onClick={() => { setEditing(null); setShowForm(true); }}>
                        <Plus size={18} />
                        Nuevo presupuesto
                    </button>
                </div>
            </header>

            <section className="budgets-stats">
                <article className="budget-stat card">
                    <span className="budget-stat__icon is-budget"><Wallet size={17} /></span>
                    <div>
                        <span>Presupuestado</span>
                        <strong className="amount-font">{formatCurrency(data?.totalBudget ?? 0)}</strong>
                    </div>
                </article>

                <article className="budget-stat card">
                    <span className="budget-stat__icon is-spent"><PiggyBank size={17} /></span>
                    <div>
                        <span>Gastado</span>
                        <strong className="amount-font">{formatCurrency(data?.totalSpent ?? 0)}</strong>
                    </div>
                </article>

                <article className={`budget-stat card ${totalRemaining < 0 ? "is-over" : ""}`}>
                    <span className="budget-stat__icon is-remaining">
                        {totalRemaining < 0 ? <AlertTriangle size={17} /> : <Wallet size={17} />}
                    </span>
                    <div>
                        <span>{totalRemaining < 0 ? "Excedido" : "Disponible"}</span>
                        <strong className={`amount-font ${totalRemaining < 0 ? "text-danger" : "text-success"}`}>
                            {formatCurrency(Math.abs(totalRemaining))}
                        </strong>
                    </div>
                </article>
            </section>

            <section className="card budgets-list-card">
                <div className="budgets-list-head">
                    <h2>Presupuestos de {dayjs(`${month}-01`).format("MMMM YYYY")}</h2>
                    <span>{budgets.length}</span>
                </div>

                {budgets.length === 0 ? (
                    <div className="budgets-empty">
                        <PiggyBank size={24} />
                        <p>No hay presupuestos para este mes.</p>
                        <button className="btn-secondary" onClick={() => setShowForm(true)}>
                            Crear el primer presupuesto
                        </button>
                    </div>
                ) : (
                    <div className="budget-list">
                        {budgets.map((budget) => {
                            const pct = Math.min(100, Math.max(0, budget.percentage));
                            return (
                                <article key={budget.id} className={`budget-row ${budget.overBudget ? "is-over" : ""}`}>
                                    <div
                                        className="budget-row__icon"
                                        style={{ background: `${budget.category.color}20`, color: budget.category.color }}
                                    >
                                        {budget.category.icon ? getIcon(budget.category.icon) : getIcon("Tag")}
                                    </div>

                                    <div className="budget-row__body">
                                        <div className="budget-row__title">
                                            <strong>{budget.category.name}</strong>
                                            {budget.overBudget && <span className="budget-over-badge">Excedido</span>}
                                        </div>
                                        <div className="budget-row__bar">
                                            <span
                                                style={{
                                                    width: `${pct}%`,
                                                    background: budget.overBudget ? "#ef4444" : budget.category.color,
                                                }}
                                            />
                                        </div>
                                        <div className="budget-row__meta">
                                            <span>{formatCurrency(budget.spent)} de {formatCurrency(budget.amount)}</span>
                                            <span className={budget.overBudget ? "text-danger" : "text-muted"}>
                                                {budget.percentage}%
                                            </span>
                                        </div>
                                    </div>

                                    <div className="budget-row__remaining">
                                        <span>{budget.remaining < 0 ? "Excedido" : "Disponible"}</span>
                                        <strong className={budget.remaining < 0 ? "text-danger" : "text-success"}>
                                            {formatCurrency(Math.abs(budget.remaining))}
                                        </strong>
                                    </div>

                                    <div className="budget-row__actions">
                                        <button type="button" onClick={() => { setEditing(budget); setShowForm(true); }} aria-label="Editar" title="Editar">
                                            <Pencil size={14} />
                                        </button>
                                        <button type="button" className="danger" onClick={() => setPendingDelete(budget)} aria-label="Eliminar" title="Eliminar">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </section>

            <ModalPortal isOpen={showForm} onClose={() => { setShowForm(false); setEditing(null); }}>
                <BudgetForm
                    budget={editing ?? undefined}
                    month={month}
                    isPending={upsertBudget.isPending}
                    onSubmit={handleSubmit}
                    onClose={() => { setShowForm(false); setEditing(null); }}
                />
            </ModalPortal>

            <InfoModal
                isOpen={!!pendingDelete}
                onClose={() => setPendingDelete(null)}
                onConfirm={handleDelete}
                type="error"
                title="Eliminar presupuesto"
                message={`¿Eliminar el presupuesto de "${pendingDelete?.category.name}"?`}
                confirmText={deleteBudget.isPending ? "Eliminando…" : "Eliminar"}
                cancelText="Cancelar"
                confirmDisabled={deleteBudget.isPending}
            />
        </div>
    );
}
