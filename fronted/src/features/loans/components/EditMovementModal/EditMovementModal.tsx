import { useState } from "react";
import { CheckCircle2, PencilLine } from "lucide-react";
import { FormContainer } from "../../../../shared/components/FormContainer/FormContainer";
import { DatePicker } from "../../../../shared/components/DateInput/DateInput";
import { TextInput } from "../../../../shared/components/TextInput/TextInput";
import type { LoanPayment } from "../../../LoanPayments/types";

interface Props {
    payment: LoanPayment;
    isPending?: boolean;
    onSubmit: (data: { date: string; note?: string }) => Promise<void>;
    onClose: () => void;
}

export function EditMovementModal({ payment, isPending, onSubmit, onClose }: Props) {
    const [date, setDate] = useState(payment.date?.slice(0, 10) ?? "");
    const [note, setNote] = useState(payment.description ?? "");
    const [error, setError] = useState<string | null>(null);

    const submit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!date) return setError("Selecciona una fecha");
        setError(null);
        await onSubmit({ date, note: note.trim() || undefined });
    };

    return (
        <FormContainer title="Editar pago" icon={<PencilLine size={20} />} error={error} className="max-w-lg mx-auto" onClose={onClose}>
            <form className="form-default-container" onSubmit={submit}>
                <DatePicker label="Fecha del pago" value={date} onChange={setDate} disabled={isPending} />
                <TextInput label="Comentario" icon="AlignLeft" value={note} onChange={setNote} placeholder="Notas del pago" disabled={isPending} textarea />
                <div className="form-actions-container">
                    <button type="submit" className="btn-submit" disabled={isPending}>
                        <CheckCircle2 size={15} /> {isPending ? "Guardando..." : "Guardar cambios"}
                    </button>
                </div>
            </form>
        </FormContainer>
    );
}
