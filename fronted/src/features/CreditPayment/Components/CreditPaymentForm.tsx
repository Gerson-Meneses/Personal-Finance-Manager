import { useState, useEffect } from "react";
import { CreditCard } from "lucide-react";
import dayjs from "dayjs";
import { usePayCreditCard } from "../hooks";
import type { DetailsError } from "../../../shared/dataApiInterface";
import { handleFieldChange } from "../../../shared/utils/handleFieldChange";
import { SelectAccount } from "../../accounts/components/selectAccount/selectAccount";
import { NumericInput } from "../../../shared/components/NumericInput/NumericInput";
import { DatePicker, TimePicker } from "../../../shared/components/DateInput/DateInput";
import { TextInput } from "../../../shared/components/TextInput/TextInput";


interface Props {
    cardId: string;
    cardName: string;
    onSuccess?: () => void;
}

export default function PaymentCreditCardForm({ cardId, cardName, onSuccess }: Props) {
    const { mutate, isPending, error, isSuccess, reset } = usePayCreditCard();
    const [localErrors, setLocalErrors] = useState<DetailsError<any> | null>(null);

    const [formData, setFormData] = useState({
        accountId: "",
        amount: 0,
        date: dayjs().format("YYYY-MM-DD"),
        time: dayjs().format("HH:mm"),
        description: `Pago ${cardName}`
    });

    useEffect(() => {
        if (isSuccess) {
            if (onSuccess) onSuccess();
        }
    }, [isSuccess]);

    const onChange = (field: string, value: any) => {
        if (error) reset();
        handleFieldChange(field as any, value, setFormData, setLocalErrors);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.amount <= 0) {
            setLocalErrors({ amount: ["El monto debe ser mayor a 0"] });
            return;
        }
        // Enviamos el cardId para la URL y el formData para el body
        mutate({ cardId, data: formData });
    };

    return (
        <form onSubmit={handleSubmit} className="form-default-container">
            <div className="form-default-tittle-container">
                <div className="form-title-icon-circle"><CreditCard size={20} /></div>
                <div>
                    <span className="form-default-title">Pagar Tarjeta</span>
                    <p className="text-muted" style={{fontSize: '0.8rem', margin: 0}}>{cardName}</p>
                </div>
            </div>

            <div className="form-default-row">
                <SelectAccount
                    label="Cuenta de Origen"
                    value={formData.accountId}
                    disabled={isPending}
                    onChange={(val) => onChange("accountId", val)}
                    error={localErrors?.accountId?.[0]}
                    noCredit // Evita pagar una tarjeta con otra tarjeta
                    required
                    icon="BanknoteArrowUp"
                />
            </div>

            <div className="form-default-row">
                <NumericInput
                    label="Monto a Pagar"
                    value={formData.amount}
                    onChange={(val) => onChange("amount", val)}
                    error={localErrors?.amount?.[0]}
                    disabled={isPending}
                    icon="CircleDollarSign"
                />
            </div>

            <div className="form-default-row">
                <DatePicker
                    disabled={isPending}
                    value={formData.date}
                    onChange={(val) => onChange("date", val)}
                />
                <TimePicker
                    disabled={isPending}
                    value={formData.time}
                    onChange={(val) => onChange("time", val)}
                    selectedDate={formData.date}
                />
            </div>

            <div className="form-default-row">
                <TextInput
                    label="Descripción"
                    disabled={isPending}
                    value={formData.description}
                    onChange={(val) => onChange("description", val)}
                    textarea
                    icon="AlignLeft"
                />
            </div>

            {error && <div className="error-banner">{error.message}</div>}

            <button className="btn-primary w-full mt-6" disabled={isPending}>
                {isPending ? "Procesando..." : "Confirmar Pago de Tarjeta"}
            </button>
        </form>
    );
}