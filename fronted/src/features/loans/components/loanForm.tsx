import { useEffect, useState } from "react";
import type { CreateLoanDTO, Loan, LoanType } from "../types";
import dayjs from "dayjs";
import { TypeToggle } from "../../../shared/components/TypeToggle/TypeToggle";
import type { UseMutationResult } from "@tanstack/react-query";
import type { DataError, DetailsError } from "../../../shared/dataApiInterface";
import { handleFieldChange } from "../../../shared/utils/handleFieldChange";
import { NumericInput } from "../../../shared/components/NumericInput/NumericInput";
import { DatePicker, TimePicker } from "../../../shared/components/DateInput/DateInput";
import { SelectAccount } from "../../accounts/components/selectAccount/selectAccount";
import { SelectInput } from "../../../shared/components/SelectOrInputText/SelectOrInputText";
import { TextInput } from "../../../shared/components/TextInput/TextInput";

interface Props {
  lenders?: Array<string>;
  mutation: UseMutationResult<Loan, DataError<CreateLoanDTO>, CreateLoanDTO>
  onSuccess?: () => void
}

const initialState: CreateLoanDTO = {
  lender: "Abi",
  principalAmount: 10,
  type: "GIVEN" as LoanType,
  startDate: dayjs().format("YYYY-MM-DD"),
  date: dayjs().format("YYYY-MM-DD"),
  time: dayjs().format("HH:mm"),
  accountId: "",
  description: ""
};

export default function LoanForm({ lenders = [], mutation, onSuccess }: Props) {

  const { mutate, isPending, error, reset } = mutation;

  const [formData, setFormData] = useState(initialState);

  const [errors, setErrors] = useState<DetailsError<CreateLoanDTO | null>>(null);

  useEffect(() => {
    setErrors(null);
    reset();
  }, []);

  useEffect(() => {
    if (error?.details) {
      setErrors(error.details as DetailsError<CreateLoanDTO>);
    }
  }, [error]);

  const onChange = <K extends keyof CreateLoanDTO>(
    field: K,
    value: CreateLoanDTO[K]
  ) => {
    handleFieldChange(field, value, setFormData, setErrors);
  };

  const getErrorMessage = (field: keyof CreateLoanDTO) => {
    return errors?.[field] ? errors[field][0] : null;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors(null);

    mutate(formData)

    onSuccess && onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="form-default-container">
      {/* Mensaje de error centralizado */}

      <div className="form-default-row">
        <TypeToggle
          value={formData.type}
          onChange={(val) => onChange("type", val as LoanType)}
          leftOption={{ label: "Preste Dinero", value: "GIVEN", color: "#a59" }}
          rightOption={{ label: "Me prestaron", value: "RECEIVED", color: "#95f" }}
        ></TypeToggle>
      </div>


      <div className="form-default-row">

        <SelectInput
          label="Persona / Prestamista"
          icon="User"
          value={formData.lender}
          options={lenders}
          onChange={(val) => onChange("lender", val)}
          placeholder="Selecciona o escribe..."
          error={getErrorMessage("lender")}
          required
        />

      </div>

      <div className="form-default-row">
        <NumericInput
          label="Monto"
          icon={"CircleDollarSign"}
          symbol="S/"
          value={formData.principalAmount}
          onChange={(val) => onChange("principalAmount", val)}
          disabled={isPending}
          required
          error={getErrorMessage("principalAmount")}
        />
      </div>

      <div className="form-default-row">
        <DatePicker
          label="Fecha de inicio"
          value={formData.startDate}
          onChange={(val) => onChange("startDate", val)}
        />
      </div>

      <div className="form-default-row">
        <SelectAccount
          value={formData.accountId}
          onChange={(val) => onChange("accountId", val)}
          balance={formData.lender == "GIVEN" ? true : false}
          error={getErrorMessage("accountId")}
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
          texarea
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

      <button type="submit" disabled={isPending}>
        {isPending ? "Guardando..." : "Crear préstamo"}
      </button>
    </form>
  );
}
