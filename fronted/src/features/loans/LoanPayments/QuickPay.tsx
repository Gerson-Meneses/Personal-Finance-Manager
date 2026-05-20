import { useLoans } from "../hooks";
import type { LoanType } from "../types";
import { handleFieldChange } from "../../../shared/utils/handleFieldChange";
import { useEffect, useState } from "react";
import type { DetailsError } from "../../../shared/dataApiInterface";
import { SuccessToast } from "../../../shared/components/SuccesToast/SuccesToast";
import { TypeToggle } from "../../../shared/components/TypeToggle/TypeToggle";
import { NumericInput } from "../../../shared/components/NumericInput/NumericInput";
import { SelectAccount } from "../../accounts/components/selectAccount/selectAccount";
import { DatePicker, TimePicker } from "../../../shared/components/DateInput/DateInput";
import { TextInput } from "../../../shared/components/TextInput/TextInput";
import { initialQuickPay, type QuickPayDTO } from "./types";

export const QuickPayForm = ({ lender, type }: { lender: string; type?: LoanType }) => {
    const { quickPay } = useLoans();
    const { mutate, isPending, error, isSuccess } = quickPay;

    const [formData, setFormData] = useState<QuickPayDTO>(initialQuickPay);
    const [errors, setErrors] = useState<DetailsError<QuickPayDTO | null>>(null);

    useEffect(() => {
        setFormData((prev) => ({
            ...prev,
            lender: lender,
            type: type || prev.type
        }))
    }, [lender, type])

    const onChange = <K extends keyof QuickPayDTO>(
        field: K,
        value: QuickPayDTO[K]
    ) => {
        handleFieldChange(field, value, setFormData, setErrors);
    };

    const getErrorMessage = (field: keyof QuickPayDTO) => {
        return errors?.[field] ? errors[field][0] : null;
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        e.stopPropagation()
        setErrors(null);
        mutate(formData)
        setFormData(initialQuickPay)
    };
    return (

        <form onSubmit={handleSubmit} className="form-default-container">
            {/* Mensaje de error centralizado */}

            <div className="form-default-row">
                <TypeToggle
                    value={formData.type}
                    onChange={(val) => onChange("type", val as LoanType)}
                    leftOption={{ label: "Preste Dinero", value: "GIVEN", color: "#941751" }}
                    rightOption={{ label: "Me prestaron", value: "RECEIVED", color: "#06B6D4" }}
                ></TypeToggle>
            </div>

            <div className="form-default-row">
                <NumericInput
                    label="Monto"
                    icon={"CircleDollarSign"}
                    symbol="S/"
                    value={formData.amount}
                    onChange={(val) => onChange("amount", val)}
                    disabled={isPending}
                    required
                    error={getErrorMessage("amount")}
                />
                <SelectAccount
                    value={formData.accountId}
                    onChange={(val) => onChange("accountId", val)}
                    balance={formData.lender == "GIVEN" ? true : false}
                    error={getErrorMessage("accountId")}
                    required
                    noCredit={formData.type == "GIVEN" ? false : true}
                />
            </div>

            <div className="form-default-row">
                <DatePicker
                    value={formData.date}
                    onChange={(val) => onChange("date", val)}
                    error={getErrorMessage("date")}
                    disabled={isPending}
                />

                <TimePicker
                    value={formData.time}
                    onChange={(val) => onChange("time", val)}
                    error={getErrorMessage("time")}
                    selectedDate={formData.date}
                    disabled={isPending}
                />
            </div>

            <div className="form-default-row">
                <TextInput
                    label="Descripción"
                    icon="AlignLeft"
                    value={formData.description}
                    placeholder="Notas adiconales..."
                    onChange={(val) => onChange("description", val)}
                    textarea
                    disabled={isPending}
                />
            </div>

            <div className="form-default-row">
                {error && !error.details && (
                    <div className="error-banner">
                        {error.message || "Ocurrió un error inesperado"}
                    </div>
                )}
            </div>
            <SuccessToast isSucces={isSuccess} successText="Préstamo guardado con éxito." >
                <button className="btn-submit" type="submit" disabled={isPending}>
                    {isPending ? "Guardando..." : "Crear préstamo"}
                </button>
            </SuccessToast>
        </form>
    )
}