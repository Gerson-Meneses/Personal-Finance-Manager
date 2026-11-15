import { useState } from "react";
import dayjs from "dayjs";
import { CalendarClock, CheckCircle2, Pause, Pencil, Play, Trash2 } from "lucide-react";
import { FormContainer } from "../../../../shared/components/FormContainer/FormContainer";
import { NumericInput } from "../../../../shared/components/NumericInput/NumericInput";
import { DatePicker } from "../../../../shared/components/DateInput/DateInput";
import { SelectInput } from "../../../../shared/components/SelectInput/SelectInput";
import { TextInput } from "../../../../shared/components/TextInput/TextInput";
import { formatCurrency } from "../../../../shared/utils/formatCurrency";
import type { Loan } from "../../types";
import type { CreateLoanPlanInput, LoanPlan } from "../../planTypes";
import { useLoanPlans } from "../../debtHooks";
import { useToast } from "../../../../shared/Hooks/useToast";

interface Props {
    loan: Loan;
    isPending?: boolean;
    onSubmit: (data: CreateLoanPlanInput) => Promise<void>;
    onClose: () => void;
}

export function LoanPlanModal({ loan, isPending, onSubmit, onClose }: Props) {
    const defaultCount = 4;
    const [amount, setAmount] = useState(String(Math.ceil((loan.amountRemaining / defaultCount) * 100) / 100));
    const [count, setCount] = useState(String(defaultCount));
    const [startDate, setStartDate] = useState(dayjs().format("YYYY-MM-DD"));
    const [frequency, setFrequency] = useState("FIFTEEN_DAYS");
    const [notes, setNotes] = useState("");
    const [error, setError] = useState<string | null>(null);
    const { plans, updatePlan, pausePlan, resumePlan, cancelPlan } = useLoanPlans(loan.id);
    const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
    const toast = useToast();

    const numericAmount = Number(amount);
    const numericCount = Number(count);
    const total = numericAmount * numericCount;
    const remainingAfter = Math.max(0, loan.amountRemaining - total);

    const startEdit = (plan: LoanPlan) => {
        setEditingPlanId(plan.id);
        setAmount(String(plan.amountPerInstallment));
        setCount(String(plan.installmentCount));
        setStartDate(plan.startDate);
        setFrequency(plan.frequency);
        setNotes(plan.notes ?? "");
        setError(null);
    };

    const submit = async (event: React.FormEvent) => {
        event.preventDefault();
        event.stopPropagation();
        setError(null);
        if (!numericAmount || numericAmount <= 0) return setError("El monto por cuota debe ser mayor a 0");
        if (!numericCount || numericCount <= 0) return setError("El número de cuotas debe ser mayor a 0");
        if (total > loan.amountRemaining + 0.009) {
            return setError(`El plan excede la deuda pendiente de ${formatCurrency(loan.amountRemaining)}`);
        }

        const payload = {
            amountPerInstallment: numericAmount,
            installmentCount: numericCount,
            startDate,
            frequency: frequency as CreateLoanPlanInput["frequency"],
            intervalCount: 1,
            notes: notes.trim() || undefined,
        };

        if (editingPlanId) {
            try {
                await updatePlan.mutateAsync({ planId: editingPlanId, data: payload });
                toast.success("Plan recalculado");
                setEditingPlanId(null);
            } catch (err) {
                setError(err instanceof Error ? err.message : "No se pudo recalcular el plan");
            }
            return;
        }

        await onSubmit(payload);
    };

    return (
        <FormContainer
            title="Planificar cuotas"
            icon={<CalendarClock size={20} />}
            error={error}
            className="max-w-lg mx-auto"
            onClose={onClose}
        >
            <form className="form-default-container" onSubmit={submit}>
                <div className="loan-plan-summary">
                    <span>Deuda pendiente con {loan.lender}</span>
                    <strong className="amount-font">{formatCurrency(loan.amountRemaining)}</strong>
                </div>

                <div className="form-default-grid-2col">
                    <NumericInput
                        label="Monto por cuota"
                        symbol="S/"
                        icon="CircleDollarSign"
                        value={amount}
                        onChange={setAmount}
                        disabled={isPending}
                        required
                    />
                    <NumericInput
                        label="Número de cuotas"
                        icon="Hash"
                        value={count}
                        onChange={setCount}
                        disabled={isPending}
                        required
                    />
                </div>

                <div className="form-default-grid-2col">
                    <DatePicker
                        label="Primera cuota"
                        value={startDate}
                        onChange={setStartDate}
                        disabled={isPending}
                        disableFuture={false}
                    />
                    <SelectInput
                        label="Frecuencia"
                        icon="Repeat"
                        value={frequency}
                        onChange={setFrequency}
                        options={[
                            { value: "FIFTEEN_DAYS", label: "Cada 15 días" },
                            { value: "MONTHLY", label: "Mensual" },
                            { value: "WEEKLY", label: "Semanal" },
                        ]}
                        disabled={isPending}
                    />
                </div>

                <div className="loan-plan-summary">
                    <span>Total planificado</span>
                    <strong>{formatCurrency(total)}</strong>
                    <small>
                        {remainingAfter > 0
                            ? `Quedarán ${formatCurrency(remainingAfter)} sin planificar`
                            : "Cubre toda la deuda pendiente"}
                    </small>
                </div>

                <TextInput
                    label="Notas"
                    icon="AlignLeft"
                    value={notes}
                    onChange={setNotes}
                    placeholder="Opcional"
                    disabled={isPending}
                    textarea
                />

                <div className="form-actions-container">
                    <button type="submit" className="btn-submit" disabled={isPending}>
                        <CheckCircle2 size={15} />
                        {isPending ? "Guardando..." : editingPlanId ? "Recalcular plan" : "Crear plan de cuotas"}
                    </button>
                    {editingPlanId && (
                        <button
                            type="button"
                            className="btn-ghost"
                            onClick={() => setEditingPlanId(null)}
                            disabled={isPending}
                        >
                            Cancelar edición
                        </button>
                    )}
                </div>
            </form>

            {plans.length > 0 && (
                <details className="loan-plan-details">
                    <summary>Planes configurados <span>{plans.length}</span></summary>
                <div className="loan-plan-list">
                    {plans.map((plan) => (
                        <div key={plan.id} className={`loan-plan-row is-${plan.status.toLowerCase()}`}>
                            <div>
                                <strong>{formatCurrency(plan.amountPerInstallment)} × {plan.installmentCount}</strong>
                                <small>{plan.status} · desde {dayjs(plan.startDate).format("D MMM YYYY")}</small>
                            </div>
                            <div className="loan-plan-row__actions">
                                {plan.status !== "CANCELLED" && (
                                    <button type="button" className="btn-ghost" onClick={() => startEdit(plan)} title="Recalcular">
                                        <Pencil size={13} />
                                    </button>
                                )}
                                {plan.status === "ACTIVE" && (
                                    <button type="button" className="btn-ghost" onClick={() => pausePlan.mutate(plan.id)} title="Pausar">
                                        <Pause size={13} />
                                    </button>
                                )}
                                {plan.status === "PAUSED" && (
                                    <button type="button" className="btn-ghost" onClick={() => resumePlan.mutate(plan.id)} title="Reactivar">
                                        <Play size={13} />
                                    </button>
                                )}
                                {(plan.status === "ACTIVE" || plan.status === "PAUSED") && (
                                    <button
                                        type="button"
                                        className="btn-ghost danger"
                                        title="Cancelar plan"
                                        onClick={() => {
                                            cancelPlan.mutate(
                                                { planId: plan.id, reason: "Cancelado por el usuario" },
                                                { onSuccess: () => toast.success("Plan cancelado") }
                                            );
                                        }}
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
                </details>
            )}
        </FormContainer>
    );
}
