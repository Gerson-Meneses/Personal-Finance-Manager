import { useEffect, useState } from "react";
import dayjs from "dayjs";
import "dayjs/locale/es";
import { AlertTriangle, Lightbulb, Pencil, PiggyBank, Plus, ShieldCheck, Sparkles, Trash2, Wallet } from "lucide-react";
import LoadingScreen from "../../../shared/components/LoadingScreen/LoadingScreen";
import ModalPortal from "../../../shared/components/ModalPortal/ModalPortal";
import InfoModal from "../../../shared/components/InfoModal/InfoModal";
import { SelectInput } from "../../../shared/components/SelectInput/SelectInput";
import { useToast } from "../../../shared/Hooks/useToast";
import { formatCurrency } from "../../../shared/utils/formatCurrency";
import { getIcon } from "../../../shared/utils/GetIcon";
import { useBudgetSuggestions, useBudgets } from "../../../features/budgets/hooks";
import { BudgetForm } from "../../../features/budgets/components/BudgetForm";
import { BudgetWizard } from "../../../features/budgets/components/BudgetWizard";
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
    const [showWizard, setShowWizard] = useState(false);
    const toast = useToast();

    const { data, loading, upsertBudget, bulkUpsertBudgets, deleteBudget } = useBudgets(month);
    const { data: suggestionData, loading: suggestionsLoading } = useBudgetSuggestions(month);
    const budgets = data?.budgets ?? [];
    const suggestions = suggestionData?.suggestions ?? [];

    useEffect(() => {
        const openWizard = () => setShowWizard(true);
        window.addEventListener("finance:open-budget-wizard", openWizard);
        return () => window.removeEventListener("finance:open-budget-wizard", openWizard);
    }, []);

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

    const handleWizardSubmit = async (items: { categoryId: string; amount: number }[]) => {
        try {
            await bulkUpsertBudgets.mutateAsync({ month, items });
            toast.success("Presupuestos creados con montos sugeridos");
            setShowWizard(false);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "No se pudieron guardar los presupuestos");
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
    const topSuggestions = suggestions.filter((item) => item.currentBudget === null).slice(0, 4);
    const budgetedCategories = new Set(budgets.map((budget) => budget.category.id));
    const pendingSuggestions = suggestions.filter(
        (item) => item.suggested > 0 && !budgetedCategories.has(item.category.id)
    );

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
                    <button className="btn-secondary" onClick={() => setShowWizard(true)}>
                        <Sparkles size={18} />
                        Usar sugerencias
                    </button>
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

            <section className="budgets-insights">
                <article className="card budgets-suggestions" data-tour="budget-suggestions">
                    <div className="budgets-list-head">
                        <h2>
                            <Sparkles size={16} /> Montos sugeridos
                        </h2>
                        {pendingSuggestions.length > 0 && (
                            <button className="btn-ghost" onClick={() => setShowWizard(true)}>
                                Configurar {pendingSuggestions.length}
                            </button>
                        )}
                    </div>

                    {suggestionsLoading && suggestions.length === 0 ? (
                        <p className="budgets-suggestions__empty">Calculando montos sugeridos...</p>
                    ) : topSuggestions.length === 0 ? (
                        <p className="budgets-suggestions__empty">
                            Ya cubriste las categorías con sugerencia. Registra más gastos para mejorar el cálculo.
                        </p>
                    ) : (
                        <>
                            <p className="budgets-suggestions__hint">
                                Basado en el promedio de tus transacciones de los últimos meses.
                            </p>
                            <div className="budgets-suggestion-grid">
                                {topSuggestions.map((item) => (
                                    <div key={item.category.id} className="budgets-suggestion">
                                        <span
                                            className="budgets-suggestion__dot"
                                            style={{ background: item.category.color }}
                                        />
                                        <div>
                                            <strong>{item.category.name}</strong>
                                            <small>
                                                {item.source === "HISTORY"
                                                    ? `Promedio ${formatCurrency(item.average)}`
                                                    : item.source === "INCOME"
                                                        ? "Basado en tus ingresos"
                                                        : "Estimación inicial"}
                                            </small>
                                        </div>
                                        <span className="amount-font">{formatCurrency(item.suggested)}</span>
                                    </div>
                                ))}
                            </div>
                            <button className="btn-secondary budgets-suggestions__cta" onClick={() => setShowWizard(true)}>
                                Crear presupuestos con estos montos
                            </button>
                        </>
                    )}
                </article>

                <aside className="card budgets-guide">
                    <div className="budgets-list-head">
                        <h2>
                            <Lightbulb size={16} /> Guía rápida
                        </h2>
                    </div>
                    <ul>
                        <li>
                            <strong>Regla 50/30/20:</strong> 50% necesidades, 30% estilo de vida y 20% ahorro o inversión.
                        </li>
                        <li>
                            <strong>Fondo de emergencia:</strong> apunta a cubrir entre 3 y 6 meses de gastos fijos.
                        </li>
                        <li>
                            <strong>Revisión semanal:</strong> ajusta antes de cerrar el mes, no después.
                        </li>
                    </ul>
                    <div className="budgets-guide__tip">
                        <ShieldCheck size={15} />
                        <span>Los préstamos y tarjetas se controlan mejor desde una categoría propia.</span>
                    </div>
                </aside>
            </section>

            <section className="card budgets-list-card" data-tour="budget-list">
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
                    suggestions={suggestions}
                    isPending={upsertBudget.isPending}
                    onSubmit={handleSubmit}
                    onClose={() => { setShowForm(false); setEditing(null); }}
                />
            </ModalPortal>

            <ModalPortal isOpen={showWizard} onClose={() => setShowWizard(false)}>
                <BudgetWizard
                    key={suggestions.map((item) => item.category.id).join(",") || "empty"}
                    month={month}
                    suggestions={suggestions}
                    isPending={bulkUpsertBudgets.isPending}
                    onSubmit={handleWizardSubmit}
                    onClose={() => setShowWizard(false)}
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
