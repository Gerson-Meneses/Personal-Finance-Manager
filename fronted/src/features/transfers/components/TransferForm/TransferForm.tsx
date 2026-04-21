import { useState, useEffect } from "react";
import { ArrowLeftRight, MoveRight } from "lucide-react";
import dayjs from "dayjs";
import { SelectAccount } from "../../../accounts/components/selectAccount/selectAccount";
import { DatePicker, TimePicker } from "../../../../shared/components/DateInput/DateInput";
import type { Account } from "../../../accounts/types";
import { NumericInput } from "../../../../shared/components/NumericInput/NumericInput";
import { TextInput } from "../../../../shared/components/TextInput/TextInput";
import type { UseMutationResult } from "@tanstack/react-query";
import type { Transaction } from "../../../transactions/types";
import type { CreateTransferDto } from "../../types";
import { handleFieldChange } from "../../../../shared/utils/handleFieldChange";
import type { DataError, DetailsError } from "../../../../shared/dataApiInterface";
import './TransferForm.css'

interface Props {
    mutation: UseMutationResult<Transaction, DataError<CreateTransferDto>, CreateTransferDto>
    account?: Account
}

export default function TransferForm({ mutation, account }: Props) {
    const { mutate, isPending, error, reset, isSuccess } = mutation;

    const [localErrors, setLocalErrors] = useState<DetailsError<CreateTransferDto> | null>(null);

    const initialStateForm: CreateTransferDto = {
        fromAccount: account?.id ?? "",
        toAccount: "",
        amount: 0,
        date: dayjs().format("YYYY-MM-DD"),
        time: dayjs().format("HH:mm"),
        description: ""
    }

    const [formData, setFormData] = useState<CreateTransferDto>(initialStateForm);

    useEffect(() => {
        if (isSuccess) {
            setFormData(initialStateForm);
            setLocalErrors(null);
        }
        if (error) reset();
        if (localErrors) setLocalErrors(null);
    }, [isSuccess]);

    // Dentro de tu componente TransferForm...

    useEffect(() => {
        if (error && error.details) {
            setLocalErrors(error.details);
        }
    }, [error]);

    const onChange = <K extends keyof CreateTransferDto>(
        field: K,
        value: CreateTransferDto[K]
    ) => {
        if (error) reset();
        handleFieldChange(field, value, setFormData, setLocalErrors);
    };

    // Helper para obtener el mensaje de error (prioriza local, luego servidor)
    const getErrorMessage = (field: keyof CreateTransferDto) => {
        return localErrors?.[field] ? localErrors[field][0] : null;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation()
        setLocalErrors(null);
        if (formData.amount <= 0) {
            setLocalErrors({ amount: ["El monto debe ser mayor a 0"] });
            return;
        }
        mutate(formData);
    };


    return (
        <form onSubmit={handleSubmit} className="form-default-container">
            <div className="form-default-tittle-container">
                <div className="form-title-icon-circle"><ArrowLeftRight size={20} /></div>
                <span className="form-default-title">Transferencia</span>
            </div>

            <div className="form-default-row">
                <SelectAccount
                    label="Origen"
                    value={formData.fromAccount}
                    disabled={isPending}
                    onChange={(val) => onChange("fromAccount", val)}
                    error={getErrorMessage("fromAccount")}
                    noCredit
                    required
                    icon="BanknoteArrowUp "
                />
                <MoveRight className="text-muted divider-icon" />
                <SelectAccount
                    label="Destino"
                    value={formData.toAccount}
                    error={getErrorMessage("toAccount")}
                    disabled={isPending}
                    onChange={(val) => onChange("toAccount", val)}
                    noAccountId={formData.fromAccount}
                    noCredit
                    required
                    icon="BanknoteArrowDown"
                />
            </div>

            <div className="form-default-row">
                <NumericInput
                    label="Monto"
                    value={formData.amount}
                    onChange={(val) => onChange("amount", val)}
                    error={getErrorMessage("amount")}
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
                    placeholder="Notas adicionales..."
                />
            </div>

            {/* Error General del Servidor */}
            {error && !error.details && (
                <div className="error-banner">
                    {error.message || "Ocurrió un error inesperado"}
                </div>
            )}

            <button className="btn-primary w-full mt-6" disabled={isPending}>
                {isPending ? "Procesando..." : "Confirmar Transferencia"}
            </button>
        </form>
    );
}
