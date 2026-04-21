import { useEffect, useState } from "react"
import { useLoans } from "../hooks"
import { NumericInput } from "../../../shared/components/NumericInput/NumericInput"
import { DatePicker } from "../../../shared/components/DateInput/DateInput"
import { SelectAccount } from "../../accounts/components/selectAccount/selectAccount"
import dayjs from "dayjs"
import type { CreateLoanPaymentDTO, Loan } from "../types"
import { handleFieldChange } from "../../../shared/utils/handleFieldChange"
import type { DetailsError } from "../../../shared/dataApiInterface"
import { SuccessToast } from "../../../shared/components/SuccesToast/SuccesToast"

interface Props { loan: Loan }

export default function LoanPaymentForm({ loan }: Props) {
    const { payLoan } = useLoans()
    const { mutate, error, isSuccess, isPending, reset } = payLoan

    const initalStateForm: CreateLoanPaymentDTO = {
        id: loan.id,
        amount: 0,
        date: dayjs().format("YYYY-MM-DD"),
        accountId: ""
    }

    const [formData, setFormData] = useState<CreateLoanPaymentDTO>(initalStateForm)
    const [errors, setErrors] = useState<DetailsError<CreateLoanPaymentDTO> | null>(null)


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        e.stopPropagation()
        mutate(formData)
    }

    const onChange = <K extends keyof CreateLoanPaymentDTO>(
        field: K,
        value: CreateLoanPaymentDTO[K]
    ) => {
        handleFieldChange(field, value, setFormData, setErrors);
    };

    const getErrorMessage = (field: keyof CreateLoanPaymentDTO) => {
        return errors?.[field] ? errors[field][0] : null;
    };

    useEffect(() => {
        console.log(isSuccess)
    }, [isSuccess])
    useEffect(() => {
        if (error?.details) {
            setErrors(error.details as DetailsError<CreateLoanPaymentDTO>);
        }
    }, [error]);

    useEffect(() => {
        setErrors(null);
        reset();
    }, []);


    return (
        <form onSubmit={handleSubmit} className="form-default-container" style={{ gap: "12px" }}>
            <div className="form-default-row">
                <NumericInput
                    label="Monto del pago"
                    icon="CircleDollarSign"
                    symbol="S/"
                    value={formData.amount}
                    onChange={(val) => onChange("amount", val)}
                    error={getErrorMessage("amount")}
                    required
                />
                <SelectAccount
                    value={formData.accountId}
                    onChange={(val) => onChange("accountId", val)}
                    error={getErrorMessage("accountId")}
                    noCredit={loan.type == "RECEIVED" ? false : true}
                    balance
                    required
                />
            </div>
            <div className="form-default-row">
                <DatePicker
                    value={formData.date}
                    onChange={(val) => onChange("date", val)}
                    error={getErrorMessage("date")}
                />
                <SuccessToast isSucces={isSuccess} successText="Pago registrado correctamente" >
                    <button
                        type="submit"
                        className=""
                        disabled={isPending}
                    >
                        {isPending ? "Registrando..." : "Registrar pago"}
                    </button>
                </SuccessToast>
            </div>
            <div className="form-default-row">
                {error && !error.details && (
                    <div className="error-banner">
                        {error.message || "Ocurrió un error inesperado"}
                    </div>
                )}
            </div>
        </form>
    )
}