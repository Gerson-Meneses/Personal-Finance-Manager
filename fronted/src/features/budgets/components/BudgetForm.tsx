import { useState } from "react";
import { CheckCircle2, PiggyBank } from "lucide-react";
import { FormContainer } from "../../../shared/components/FormContainer/FormContainer";
import SelectCategory from "../../categories/components/selectCategory";
import { NumericInput } from "../../../shared/components/NumericInput/NumericInput";
import type { BudgetItem, BudgetSuggestion } from "../types";
import { formatCurrency } from "../../../shared/utils/formatCurrency";

interface Props {
    budget?: BudgetItem;
    month: string;
    suggestions?: BudgetSuggestion[];
    isPending?: boolean;
    onSubmit: (data: { categoryId: string; amount: number }) => Promise<void>;
    onClose?: () => void;
}

export function BudgetForm({ budget, month, suggestions = [], isPending, onSubmit, onClose }: Props) {
    const [categoryId, setCategoryId] = useState(budget?.category.id ?? "");
    const [amount, setAmount] = useState(budget ? String(budget.amount) : "");
    const [errors, setErrors] = useState<{ categoryId?: string; amount?: string }>({});
    const [attempted, setAttempted] = useState(false);
    const selectedSuggestion = suggestions.find((item) => item.category.id === categoryId);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        event.stopPropagation();
        setAttempted(true);

        const nextErrors: typeof errors = {};
        if (!categoryId) nextErrors.categoryId = "Selecciona una categoría";
        const numericAmount = Number(amount);
        if (!amount || Number.isNaN(numericAmount) || numericAmount <= 0) {
            nextErrors.amount = "Ingresa un monto mayor a 0";
        }
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) return;

        await onSubmit({ categoryId, amount: numericAmount });
    };

    return (
        <FormContainer
            title={budget ? "Editar presupuesto" : "Nuevo presupuesto"}
            icon={<PiggyBank size={20} />}
            error={attempted && Object.keys(errors).length > 0 ? "Revisa los campos marcados." : null}
            className="max-w-lg mx-auto"
            onClose={onClose}
        >
            <form className="form-default-container" onSubmit={handleSubmit}>
                <SelectCategory
                    label="Categoría de gasto"
                    value={categoryId}
                    onChange={(value) => {
                        setCategoryId(value);
                        setErrors((prev) => ({ ...prev, categoryId: undefined }));
                        const suggestion = suggestions.find((item) => item.category.id === value);
                        if (!amount && suggestion) setAmount(String(suggestion.suggested));
                    }}
                    type="EXPENSE"
                    noLoan
                    disabled={!!budget || isPending}
                    error={errors.categoryId}
                    required
                />

                <NumericInput
                    label={`Presupuesto de ${month}`}
                    symbol="S/"
                    icon="CircleDollarSign"
                    value={amount}
                    onChange={(value) => {
                        setAmount(value);
                        setErrors((prev) => ({ ...prev, amount: undefined }));
                    }}
                    disabled={isPending}
                    error={errors.amount}
                    required
                />

                {selectedSuggestion && (
                    <div className="budget-suggestion">
                        <div>
                            <strong>
                                {selectedSuggestion.source === "HISTORY"
                                    ? "Sugerido según tus últimos meses"
                                    : selectedSuggestion.source === "INCOME"
                                        ? "Sugerido según tus ingresos"
                                        : "Estimación inicial"}
                            </strong>
                            <span>
                                {selectedSuggestion.source === "HISTORY"
                                    ? `Promedio ${formatCurrency(selectedSuggestion.average)} en ${selectedSuggestion.monthsWithData} mes${selectedSuggestion.monthsWithData === 1 ? "" : "es"}`
                                    : selectedSuggestion.source === "INCOME"
                                        ? "Aún no hay suficientes gastos en esta categoría"
                                        : "Ajusta este monto según tu realidad"}
                            </span>
                        </div>
                        <button
                            type="button"
                            className="btn-ghost"
                            onClick={() => setAmount(String(selectedSuggestion.suggested))}
                        >
                            Usar {formatCurrency(selectedSuggestion.suggested)}
                        </button>
                    </div>
                )}

                <div className="form-actions-container">
                    <button type="submit" className="btn-submit" disabled={isPending}>
                        <CheckCircle2 size={15} />
                        {isPending ? "Guardando…" : budget ? "Actualizar presupuesto" : "Crear presupuesto"}
                    </button>
                </div>
            </form>
        </FormContainer>
    );
}
