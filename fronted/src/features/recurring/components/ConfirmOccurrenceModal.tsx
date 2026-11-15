import { useState } from "react";
import { CheckCircle2, PencilLine } from "lucide-react";
import { FormContainer } from "../../../shared/components/FormContainer/FormContainer";
import { NumericInput } from "../../../shared/components/NumericInput/NumericInput";
import { TextInput } from "../../../shared/components/TextInput/TextInput";
import { formatCurrency } from "../../../shared/utils/formatCurrency";
import type { RecurringOccurrence } from "../types";

interface Props {
    occurrence: RecurringOccurrence;
    isPending?: boolean;
    onSubmit: (data: { amount: number; note?: string }) => Promise<void>;
    onClose: () => void;
}

const getAmountLabel = (occurrence: RecurringOccurrence) => {
    if (occurrence.loanAction === "ADVANCE_LOAN") return "Monto del cargo";
    if (occurrence.loanAction === "PAY_LOAN") return "Monto a pagar";
    if (occurrence.loanAction === "GIVE_LOAN" || occurrence.loanAction === "RECEIVE_LOAN") {
        return "Monto del préstamo";
    }
    return "Monto real";
};

export function ConfirmOccurrenceModal({ occurrence, isPending, onSubmit, onClose }: Props) {
    const planned = occurrence.plannedAmount ?? occurrence.amount;
    const [amount, setAmount] = useState(String(planned));
    const [note, setNote] = useState("");
    const [attempted, setAttempted] = useState(false);
    const numericAmount = Number(amount);
    const changed = Math.abs(numericAmount - planned) > 0.009;

    const submit = async (event: React.FormEvent) => {
        event.preventDefault();
        event.stopPropagation();
        setAttempted(true);
        if (!numericAmount || numericAmount <= 0) return;
        await onSubmit({ amount: numericAmount, note: note.trim() || undefined });
    };

    return (
        <FormContainer
            title="Editar y confirmar"
            icon={<PencilLine size={20} />}
            error={attempted && (!numericAmount || numericAmount <= 0) ? "Ingresa un monto mayor a 0." : null}
            className="max-w-lg mx-auto"
            onClose={onClose}
        >
            <form className="form-default-container" onSubmit={submit}>
                <div className="occurrence-confirm-summary">
                    <div>
                        <span>{occurrence.name}</span>
                        <small>{occurrence.category?.name ?? "Sin categoría"} · {occurrence.account?.name ?? "Sin cuenta"}</small>
                    </div>
                    <div>
                        <span>Planificado</span>
                        <strong>{formatCurrency(planned)}</strong>
                    </div>
                </div>

                {changed && (
                    <p className="recurring-form-hint">
                        El monto difiere del planificado. Se ejecutará el monto real y quedará registrado en el historial.
                    </p>
                )}

                <NumericInput
                    label={getAmountLabel(occurrence)}
                    symbol="S/"
                    icon="CircleDollarSign"
                    value={amount}
                    onChange={setAmount}
                    disabled={isPending}
                    required
                />

                <TextInput
                    label="Comentario (opcional)"
                    icon="AlignLeft"
                    value={note}
                    onChange={setNote}
                    placeholder="Ej. El recibo subió por consumo adicional"
                    disabled={isPending}
                    textarea
                />

                <div className="form-actions-container">
                    <button type="submit" className="btn-submit" disabled={isPending}>
                        <CheckCircle2 size={15} />
                        {isPending ? "Confirmando..." : "Confirmar movimiento"}
                    </button>
                </div>
            </form>
        </FormContainer>
    );
}
