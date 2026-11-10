import { useState } from "react";
import { CheckCircle2, PiggyBank } from "lucide-react";
import { FormContainer } from "../../../shared/components/FormContainer/FormContainer";
import SelectCategory from "../../categories/components/selectCategory";
import { NumericInput } from "../../../shared/components/NumericInput/NumericInput";
import type { BudgetItem } from "../types";

interface Props {
    budget?: BudgetItem;
    month: string;
    isPending?: boolean;
    onSubmit: (data: { categoryId: string; amount: number }) => Promise<void>;
    onClose?: () => void;
}

export function BudgetForm({ budget, month, isPending, onSubmit, onClose }: Props) {
    const [categoryId, setCategoryId] = useState(budget?.category.id ?? "");
    const [amount, setAmount] = useState(budget ? String(budget.amount) : "");
    const [errors, setErrors] = useState<{ categoryId?: string; amount?: string }>({});
    const [attempted, setAttempted] = useState(false);

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
