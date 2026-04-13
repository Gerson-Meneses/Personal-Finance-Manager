import { useEffect, useState } from "react";
import type { Account, AccountType, CreateAccountDTO, UpdateAccountDTO } from "../../types";
import type { UseMutationResult } from "@tanstack/react-query";
import type { DataError, DetailsError } from "../../../../shared/dataApiInterface";
import { handleFieldChange } from "../../../../shared/utils/handleFieldChange";
import { TypeToggle } from "../../../../shared/components/TypeToggle/TypeToggle";
import { TextInput } from "../../../../shared/components/TextInput/TextInput";
import { ColorPicker } from "../../../../shared/components/ColorPicker/ColorPicker";
import { IconPicker } from "../../../../shared/components/IconPicker/IconPicker";
import "./accountForm.css"
import { NumericInput } from "../../../../shared/components/NumericInput/NumericInput";
import { SuccessToast } from "../../../../shared/components/SuccesToast/SuccesToast";

interface Fields {
    name?: boolean
    balance?: boolean
    type?: boolean
    color?: boolean
    icon?: boolean
    creditLimit?: boolean
    billingCloseDay?: boolean
    paymentDueDay?: boolean
    overdraft?: boolean
}

interface PropsAccountForm {
    mutation: UseMutationResult<Account, DataError<CreateAccountDTO>, CreateAccountDTO | UpdateAccountDTO>
    account?: Account
    fieldsHidden?: Fields
    fieldsDisabled?: Fields
    isEdit?: boolean
    onSuccess?: () => void
}

/* function generarColorHex() {
    const hex = Math.floor(Math.random() * 16777215).toString(16);
    return "#" + hex.padStart(6, '0');
} */

export default function AccountForm({ mutation, account, fieldsHidden, fieldsDisabled, isEdit, onSuccess }: PropsAccountForm) {

    const { mutate, isPending, error, reset, isSuccess } = mutation;

    const initialStateForm: CreateAccountDTO = {
        type: "CREDIT",
        name: "",
        color: "",
        icon: "Banknote",
        creditLimit: 0,
        billingCloseDay: 0,
        paymentDueDay: 0,
        overdraft: 0
    }

    const [formData, setFormData] = useState<CreateAccountDTO>(initialStateForm);
    const [errors, setErrors] = useState<DetailsError<CreateAccountDTO> | null>(null);

    useEffect(() => {
        if (isSuccess) {
            if (!isEdit) setFormData(initialStateForm);
            setErrors(null);
            reset();
            onSuccess && onSuccess();
        }
    }, [isSuccess]);

    useEffect(() => {
        if (isEdit && account) {
            setFormData({
                type: account.type,
                name: account.name,
                color: account.color,
                icon: account.icon,
                creditLimit: account.creditLimit,
                billingCloseDay: account.billingCloseDay,
                paymentDueDay: account.paymentDueDay,
                overdraft: account.overdraft
            });
        }
    }, [isEdit, account]);


    useEffect(() => {
        if (error?.details) {
            setErrors(error.details as DetailsError<CreateAccountDTO>);
        }
    }, [error]);

    useEffect(() => {
        reset();
        setErrors(null);
    }, [])


    const onChange = <K extends keyof CreateAccountDTO>(
        field: K,
        value: CreateAccountDTO[K]
    ) => {
        handleFieldChange(field, value, setFormData, setErrors);
    };

    const getErrorMessage = (field: keyof CreateAccountDTO) => {
        return errors?.[field] ? errors[field][0] : null;
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setErrors(null);

        if (isEdit && account) {
            const updateData: UpdateAccountDTO = {
                ...formData,
                accountId: account.id
            };
            mutate(updateData);
        } else {
            mutate(formData);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="form-default-container">
            <h2>{isEdit ? "Editar cuenta" : "Crear nueva cuenta"}</h2>

            <div className="form-default-row">
                {!fieldsHidden?.type && (
                    <TypeToggle
                        label="Tipo de cuenta"
                        value={formData.type}
                        onChange={(val) => {
                            onChange("type", val as AccountType);
                        }}
                        disabled={fieldsDisabled?.type}
                        error={getErrorMessage("type")}
                        leftOption={{ label: "Débito", value: "DEBIT", color: "#59f" }}
                        rightOption={{ label: "Credito", value: "CREDIT", color: "#f2f" }}
                    />
                )}
            </div>

            <div className="form-default-row">
                {!fieldsHidden?.name && (
                    <TextInput
                        label="Nombre de la cuenta"
                        value={formData.name}
                        onChange={(val) => onChange("name", val)}
                        error={getErrorMessage("name")}
                    />)}
            </div>
            <div className="form-default-row">
                {!fieldsHidden?.color && (
                    <ColorPicker
                        value={formData.color}
                        onChange={(val) => onChange("color", val)}
                    />)}
                {!fieldsHidden?.icon && (
                    <IconPicker
                        label="Icono"
                        value={formData.icon}
                        onChange={(val) => onChange("icon", val)}
                        error={getErrorMessage("icon")}
                    />)}
            </div>

            {formData.type === "CREDIT" && (
                <div className="form-credit-section">
                    <div className="form-default-row">
                        {!fieldsHidden?.creditLimit && (
                            <NumericInput
                                label="Límite de crédito"
                                value={formData.creditLimit}
                                placeholder="0"
                                icon={"ArrowUpRightFromCircle"}
                                onChange={(val) => onChange("creditLimit", val)}
                                error={getErrorMessage("creditLimit")}
                            />
                        )}

                        {!fieldsHidden?.overdraft && (
                            <NumericInput
                                label="Sobregiro permitido"
                                value={formData.overdraft}
                                placeholder="0"
                                symbol="%"
                                icon={"TrendingUp"}
                                onChange={(val) => onChange("overdraft", val)}
                                error={getErrorMessage("overdraft")}
                            />
                        )}
                    </div>
                    <div className="form-default-row">
                        {!fieldsHidden?.billingCloseDay && (
                            <NumericInput
                                label="Día de cierre"
                                value={formData.billingCloseDay}
                                placeholder="1-28"
                                icon={"CalendarRange"}
                                onChange={(val) => onChange("billingCloseDay", val)}
                                error={getErrorMessage("billingCloseDay")}
                            />
                        )}

                        {!fieldsHidden?.paymentDueDay && (
                            <NumericInput
                                label="Día de vencimiento"
                                value={formData.paymentDueDay}
                                placeholder="1-28"
                                icon={"CalendarCheck"}
                                onChange={(val) => onChange("paymentDueDay", val)}
                                error={getErrorMessage("paymentDueDay")}
                            />
                        )}
                    </div>
                </div>
            )}
            {error && !error.details && (
                <div className="error-banner">
                    {error.message || "Ocurrió un error inesperado"}
                </div>
            )}
            <SuccessToast isSucces={isSuccess} successText={"Cuenta " + (isEdit ? "actulizada" : "creada") + " con exito."}>
                <button className="form-default-button" type="submit" disabled={isPending}>
                    {isPending ? "Guardando..." : isEdit ? "Actualizar" : "Crear"}
                </button>
            </SuccessToast>
        </form>
    )

}