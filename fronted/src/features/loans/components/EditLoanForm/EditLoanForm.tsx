import { useState } from "react";
import { CheckCircle2, PencilLine } from "lucide-react";
import { FormContainer } from "../../../../shared/components/FormContainer/FormContainer";
import { SelectInput } from "../../../../shared/components/SelectInput/SelectInput";
import { DatePicker } from "../../../../shared/components/DateInput/DateInput";
import { NumericInput } from "../../../../shared/components/NumericInput/NumericInput";
import { TextInput } from "../../../../shared/components/TextInput/TextInput";
import { useContacts } from "../../../contacts/hooks";
import type { Loan } from "../../types";

interface Props {
    loan: Loan;
    isPending?: boolean;
    onSubmit: (data: {
        contactId?: string;
        notes?: string | null;
        startDate?: string;
        principalAmount?: number;
        reason?: string;
    }) => Promise<void>;
    onClose: () => void;
}

export function EditLoanForm({ loan, isPending, onSubmit, onClose }: Props) {
    const { contacts } = useContacts();
    const [contactId, setContactId] = useState(loan.contact?.id ?? "");
    const [startDate, setStartDate] = useState(loan.startDate?.slice(0, 10) ?? "");
    const [principal, setPrincipal] = useState(String(loan.principalAmount ?? ""));
    const [notes, setNotes] = useState(loan.notes ?? "");
    const [reason, setReason] = useState("");
    const [error, setError] = useState<string | null>(null);

    const numericPrincipal = Number(principal);
    const principalChanged = Math.abs(numericPrincipal - Number(loan.principalAmount)) > 0.009;

    const submit = async (event: React.FormEvent) => {
        event.preventDefault();
        event.stopPropagation();
        setError(null);
        if (!numericPrincipal || numericPrincipal <= 0) {
            setError("El monto debe ser mayor a 0");
            return;
        }

        await onSubmit({
            contactId: contactId || undefined,
            notes: notes.trim() || null,
            startDate: startDate || undefined,
            principalAmount: principalChanged ? numericPrincipal : undefined,
            reason: reason.trim() || undefined,
        });
    };

    return (
        <FormContainer
            title="Editar préstamo"
            icon={<PencilLine size={20} />}
            error={error}
            className="max-w-lg mx-auto"
            onClose={onClose}
        >
            <form className="form-default-container" onSubmit={submit}>
                <SelectInput
                    label="Contacto"
                    icon="User"
                    value={contactId}
                    onChange={setContactId}
                    options={contacts.map((contact) => ({ value: contact.id, label: contact.name }))}
                    placeholder="Selecciona un contacto"
                    disabled={isPending}
                />

                <DatePicker
                    label="Fecha de inicio"
                    value={startDate}
                    onChange={setStartDate}
                    disabled={isPending}
                    disableFuture={false}
                />

                <NumericInput
                    label="Monto inicial / total prestado"
                    symbol="S/"
                    icon="CircleDollarSign"
                    value={principal}
                    onChange={setPrincipal}
                    disabled={isPending}
                    required
                />

                {principalChanged && (
                    <p className="recurring-form-hint">
                        El monto cambiará mediante un movimiento de ajuste auditado. No se reescribirán los pagos históricos.
                    </p>
                )}

                {principalChanged && (
                    <TextInput
                        label="Motivo del ajuste (opcional)"
                        icon="AlignLeft"
                        value={reason}
                        onChange={setReason}
                        placeholder="Ej. Faltaba incluir un cargo adicional"
                        disabled={isPending}
                    />
                )}

                <TextInput
                    label="Notas"
                    icon="AlignLeft"
                    value={notes}
                    onChange={setNotes}
                    placeholder="Notas del préstamo"
                    disabled={isPending}
                    textarea
                />

                <div className="form-actions-container">
                    <button type="submit" className="btn-submit" disabled={isPending}>
                        <CheckCircle2 size={15} />
                        {isPending ? "Guardando..." : "Guardar cambios"}
                    </button>
                </div>
            </form>
        </FormContainer>
    );
}
