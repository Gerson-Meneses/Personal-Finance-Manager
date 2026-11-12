import { useMemo, useState } from "react";
import { CheckCircle2, Sparkles, WandSparkles } from "lucide-react";
import { FormContainer } from "../../../shared/components/FormContainer/FormContainer";
import { formatCurrency } from "../../../shared/utils/formatCurrency";
import type { BudgetSuggestion } from "../types";

interface Props {
    month: string;
    suggestions: BudgetSuggestion[];
    isPending?: boolean;
    onSubmit: (items: { categoryId: string; amount: number }[]) => Promise<void>;
    onClose?: () => void;
}

const MAX_SUGGESTIONS = 8;

export function BudgetWizard({ month, suggestions, isPending, onSubmit, onClose }: Props) {
    const candidates = useMemo(
        () =>
            suggestions
                .filter((item) => item.suggested > 0 && item.currentBudget === null)
                .slice(0, MAX_SUGGESTIONS),
        [suggestions]
    );

    const [selected, setSelected] = useState<Record<string, boolean>>(() =>
        Object.fromEntries(candidates.map((item) => [item.category.id, true]))
    );
    const [amounts, setAmounts] = useState<Record<string, string>>(() =>
        Object.fromEntries(candidates.map((item) => [item.category.id, String(item.suggested)]))
    );
    const [attempted, setAttempted] = useState(false);

    const selectedItems = candidates
        .filter((item) => selected[item.category.id])
        .map((item) => ({
            categoryId: item.category.id,
            amount: Number(amounts[item.category.id] ?? 0),
        }));

    const total = selectedItems.reduce((sum, item) => sum + (item.amount || 0), 0);
    const hasInvalidAmount = selectedItems.some((item) => !item.amount || item.amount <= 0);

    const submit = async (event: React.FormEvent) => {
        event.preventDefault();
        event.stopPropagation();
        setAttempted(true);
        if (!selectedItems.length || hasInvalidAmount) return;
        await onSubmit(selectedItems);
    };

    return (
        <FormContainer
            title="Configurar presupuesto del mes"
            icon={<WandSparkles size={20} />}
            error={attempted && (!selectedItems.length || hasInvalidAmount) ? "Revisa las categorías y montos seleccionados." : null}
            className="max-w-2xl mx-auto"
            onClose={onClose}
        >
            <form className="form-default-container budget-wizard" onSubmit={submit}>
                <div className="budget-wizard__intro">
                    <p>
                        Elegimos montos sugeridos a partir de tus gastos de los últimos meses.
                        Puedes ajustarlos antes de guardar.
                    </p>
                    <span className="budget-wizard__badge">
                        <Sparkles size={13} /> {month}
                    </span>
                </div>

                {candidates.length === 0 ? (
                    <div className="budget-wizard__empty">
                        <p>No hay nuevas categorías con sugerencia para este mes.</p>
                        <p className="text-muted">
                            Registra algunos gastos o crea presupuestos manualmente desde la página de presupuestos.
                        </p>
                    </div>
                ) : (
                    <div className="budget-wizard__list">
                        {candidates.map((item) => (
                            <label
                                key={item.category.id}
                                className={`budget-wizard__row ${selected[item.category.id] ? "is-selected" : ""}`}
                            >
                                <input
                                    type="checkbox"
                                    checked={!!selected[item.category.id]}
                                    onChange={(event) =>
                                        setSelected((prev) => ({
                                            ...prev,
                                            [item.category.id]: event.target.checked,
                                        }))
                                    }
                                    disabled={isPending}
                                />

                                <span
                                    className="budget-wizard__dot"
                                    style={{ background: item.category.color }}
                                />

                                <span className="budget-wizard__name">
                                    <strong>{item.category.name}</strong>
                                    <small>
                                        {item.source === "HISTORY"
                                            ? `Promedio: ${formatCurrency(item.average)}`
                                            : item.source === "INCOME"
                                                ? "Basado en tus ingresos"
                                                : "Estimación inicial"}
                                    </small>
                                </span>

                                <span className="budget-wizard__amount">
                                    <span>S/</span>
                                    <input
                                        type="number"
                                        min="1"
                                        step="0.01"
                                        inputMode="decimal"
                                        value={amounts[item.category.id] ?? ""}
                                        onChange={(event) =>
                                            setAmounts((prev) => ({
                                                ...prev,
                                                [item.category.id]: event.target.value,
                                            }))
                                        }
                                        disabled={isPending || !selected[item.category.id]}
                                        aria-label={`Presupuesto para ${item.category.name}`}
                                    />
                                </span>
                            </label>
                        ))}
                    </div>
                )}

                <div className="budget-wizard__total">
                    <span>Total a presupuestar</span>
                    <strong className="amount-font">{formatCurrency(total)}</strong>
                </div>

                <div className="form-actions-container">
                    <button
                        type="submit"
                        className="btn-submit"
                        disabled={isPending || !selectedItems.length || hasInvalidAmount}
                    >
                        <CheckCircle2 size={15} />
                        {isPending ? "Guardando..." : "Guardar presupuesto"}
                    </button>
                </div>
            </form>
        </FormContainer>
    );
}
