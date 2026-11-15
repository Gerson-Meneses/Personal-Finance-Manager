import { useState } from "react";
import { CheckCircle2, HeartHandshake } from "lucide-react";
import { FormContainer } from "../../../../shared/components/FormContainer/FormContainer";
import { NumericInput } from "../../../../shared/components/NumericInput/NumericInput";
import { TextInput } from "../../../../shared/components/TextInput/TextInput";
import { formatCurrency } from "../../../../shared/utils/formatCurrency";
import type { Loan } from "../../types";

interface Props {
    loan: Loan;
    isPending?: boolean;
    onSubmit: (data: { amount: number; reason?: string }) => Promise<void>;
    onClose: () => void;
}

export function ForgiveLoanModal({ loan, isPending, onSubmit, onClose }: Props) {
    const [amount, setAmount] = useState(String(loan.amountRemaining));
    const [reason, setReason] = useState("");
    const [error, setError] = useState<string | null>(null);
    const numeric = Number(amount);

    const submit = async (event: React.FormEvent) => {
        event.preventDefault();
        event.stopPropagation();
        if (!numeric || numeric <= 0) return setError("Ingresa un monto mayor a 0");
        if (numeric > loan.amountRemaining + 0.009) {
            return setError(`Máximo condonable: ${formatCurrency(loan.amountRemaining)}`);
        }
        setError(null);
        await onSubmit({ amount: numeric, reason: reason.trim() || undefined });
    };

    return (
        <FormContainer
            title="Condonar saldo"
            icon={<HeartHandshake size={20} />}
            error={error}
            className="max-w-lg mx-auto"
            onClose={onClose}
        >
            <form className="form-default-container" onSubmit={submit}>
                <div className="loan-plan-summary">
                    <span>Saldo pendiente con {loan.lender}</span>
                    <strong className="amount-font">{formatCurrency(loan.amountRemaining)}</strong>
                    <small>La condonación reduce la deuda sin mover dinero de tus cuentas.</small>
                </div>

                <NumericInput
                    label="Monto a condonar"
                    symbol="S/"
                    icon="CircleDollarSign"
                    value={amount}
                    onChange={setAmount}
                    disabled={isPending}
                    required
                />

                <TextInput
                    label="Motivo (opcional)"
                    icon="AlignLeft"
                    value={reason}
                    onChange={setReason}
                    placeholder="Ej. Acuerdo con la persona"
                    disabled={isPending}
                    textarea
                />

                <div className="form-actions-container">
                    <button type="submit" className="btn-submit" disabled={isPending}>
                        <CheckCircle2 size={15} />
                        {isPending ? "Condonando..." : "Condonar saldo"}
                    </button>
                </div>
            </form>
        </FormContainer>
    );
}
