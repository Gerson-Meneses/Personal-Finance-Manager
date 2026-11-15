import { useState } from "react";
import dayjs from "dayjs";
import { CheckCircle2, HandCoins } from "lucide-react";
import { FormContainer } from "../../../../shared/components/FormContainer/FormContainer";
import { NumericInput } from "../../../../shared/components/NumericInput/NumericInput";
import { TextInput } from "../../../../shared/components/TextInput/TextInput";
import { SelectAccount } from "../../../accounts/components/selectAccount/selectAccount";
import { formatCurrency } from "../../../../shared/utils/formatCurrency";
import type { DebtInstallmentItem } from "../../planTypes";

interface Props {
    installment: DebtInstallmentItem;
    isPending?: boolean;
    onSubmit: (data: { amount: number; accountId: string; note?: string }) => Promise<void>;
    onClose: () => void;
}

export function PayInstallmentModal({ installment, isPending, onSubmit, onClose }: Props) {
    const [amount, setAmount] = useState(String(installment.remaining));
    const [accountId, setAccountId] = useState("");
    const [note, setNote] = useState("");
    const [error, setError] = useState<string | null>(null);

    const submit = async (event: React.FormEvent) => {
        event.preventDefault();
        event.stopPropagation();
        const numeric = Number(amount);
        if (!numeric || numeric <= 0) return setError("Ingresa un monto mayor a 0");
        if (!accountId) return setError("Selecciona una cuenta");
        if (numeric > installment.remaining + 0.009) {
            return setError(`Máximo para esta cuota: ${formatCurrency(installment.remaining)}`);
        }
        setError(null);
        await onSubmit({ amount: numeric, accountId, note: note.trim() || undefined });
    };

    return (
        <FormContainer
            title="Pagar cuota"
            icon={<HandCoins size={20} />}
            error={error}
            className="max-w-lg mx-auto"
            onClose={onClose}
        >
            <form className="form-default-container" onSubmit={submit}>
                <div className="loan-plan-summary">
                    <span>{installment.contact?.name ?? installment.loan?.lender ?? "Cuota"} · {installment.dueDate ? dayjs(installment.dueDate).format("D MMM YYYY") : "Sin fecha"}</span>
                    <strong className="amount-font">{formatCurrency(installment.remaining)}</strong>
                    <small>Cuota {installment.sequence} · {installment.loan?.lender ?? "Préstamo"}</small>
                </div>

                <NumericInput
                    label="Monto a pagar"
                    symbol="S/"
                    icon="CircleDollarSign"
                    value={amount}
                    onChange={setAmount}
                    disabled={isPending}
                    required
                />

                <SelectAccount
                    label="Cuenta de pago"
                    value={accountId}
                    onChange={setAccountId}
                    disabled={isPending}
                    required
                />

                <TextInput
                    label="Comentario (opcional)"
                    icon="AlignLeft"
                    value={note}
                    onChange={setNote}
                    placeholder="Notas del pago"
                    disabled={isPending}
                    textarea
                />

                <div className="form-actions-container">
                    <button type="submit" className="btn-submit" disabled={isPending}>
                        <CheckCircle2 size={15} />
                        {isPending ? "Pagando..." : "Confirmar pago"}
                    </button>
                </div>
            </form>
        </FormContainer>
    );
}
