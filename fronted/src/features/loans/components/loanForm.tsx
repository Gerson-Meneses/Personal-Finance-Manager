import type { CreateLoanDTO, Loan, LoanType } from "../types";
import dayjs from "dayjs";
import { TypeToggle } from "../../../shared/components/TypeToggle/TypeToggle";
import type { UseMutationResult } from "@tanstack/react-query";
import type { DataError } from "../../../shared/dataApiInterface";
import { NumericInput } from "../../../shared/components/NumericInput/NumericInput";
import { DatePicker, TimePicker } from "../../../shared/components/DateInput/DateInput";
import { SelectAccount } from "../../accounts/components/selectAccount/selectAccount";
import { SelectOrInputText } from "../../../shared/components/SelectOrInputText/SelectOrInputText";
import { TextInput } from "../../../shared/components/TextInput/TextInput";
import { SuccessToast } from "../../../shared/components/SuccesToast/SuccesToast";
import { useFormHandler } from "../../../shared/Hooks/UseFormHandler";


interface Props {
  lenders?: Array<string>;
  mutation: UseMutationResult<Loan, DataError<CreateLoanDTO>, CreateLoanDTO>
  onSuccess?: () => void
}

const initialState: CreateLoanDTO = {
  lender: "",
  amount: 0,
  type: "GIVEN" as LoanType,
  startDate: dayjs().format("YYYY-MM-DD"),
  date: dayjs().format("YYYY-MM-DD"),
  time: dayjs().format("HH:mm"),
  accountId: "",
  description: ""
};

/**
 * Validación básica para el formulario de préstamos
 */
const validateLoanForm = (data: CreateLoanDTO): Record<string, [string]> | null => {
  const errors: Record<string, [string]> = {};

  if (!data.lender?.trim()) {
    errors.lender = ["La persona es requerida"];
  }

  if (data.amount <= 0) {
    errors.amount = ["El monto debe ser mayor a 0"];
  }

  if (!data.accountId) {
    errors.accountId = ["La cuenta es requerida"];
  }

  if (!data.date) {
    errors.date = ["La fecha es requerida"];
  }

  return Object.keys(errors).length > 0 ? errors : null;
};

export default function LoanForm({ lenders = [], mutation, onSuccess }: Props) {
  
  const {
    formData,
    onChange,
    getErrorMessage,
    handleSubmit,
    isPending,
    isSuccess,
    serverError,
  } = useFormHandler<CreateLoanDTO>({
    mutation,
    initialState,
    onSuccess,
    validationFn: validateLoanForm,
  });

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    handleSubmit(e, (data) => {
      mutation.mutate(data);
    });
  };

  const isDisabled = isPending;

  return (
    <form onSubmit={handleFormSubmit} className="form-default-container" noValidate>
      <h2>Crear Préstamo</h2>

      {/* Fila: Tipo de préstamo */}
      <div className="form-default-row">
        <TypeToggle<LoanType>
          value={formData.type}
          onChange={(val) => onChange("type", val as LoanType)}
          leftOption={{ label: "Presté Dinero", value: "GIVEN", color: "#941751" }}
          rightOption={{ label: "Me prestaron", value: "RECEIVED", color: "#06B6D4" }}
          disabled={isDisabled}
        />
      </div>

      {/* Fila: Persona/Prestamista */}
      <div className="form-default-row">
        <SelectOrInputText
          label="Persona / Prestamista"
          icon="User"
          value={formData.lender}
          options={lenders}
          onChange={(val) => onChange("lender", val)}
          placeholder="Selecciona o escribe..."
          error={getErrorMessage("lender")!}
          disabled={isDisabled}
          required
          name="loan-lender"
        />
      </div>

      {/* Fila: Monto y Cuenta */}
      <div className="form-default-row">
        <NumericInput
          label="Monto"
          icon="CircleDollarSign"
          symbol="S/"
          value={formData.amount.toString()}
          onChange={(val) => onChange("amount", Number(val))}
          disabled={isDisabled}
          required
          error={getErrorMessage("amount")!}
        />

        <SelectAccount
          value={formData.accountId}
          onChange={(val) => onChange("accountId", val)}
          error={getErrorMessage("accountId")}
          required
          noCredit={formData.type === "GIVEN" ? false : true}
          disabled={isDisabled}
        />
      </div>

      {/* Fila: Fecha de inicio */}
      <div className="form-default-row">
        <DatePicker
          label="Fecha de inicio"
          value={formData.startDate}
          onChange={(val) => onChange("startDate", val)}
          disabled={isDisabled}
        />
      </div>

      {/* Fila: Fecha y Hora de registro */}
      <div className="form-default-row">
        <DatePicker
          value={formData.date}
          onChange={(val) => onChange("date", val)}
          error={getErrorMessage("date")!}
          disabled={isDisabled}
        />

        <TimePicker
          value={formData.time}
          onChange={(val) => onChange("time", val)}
          error={getErrorMessage("time")!}
          selectedDate={formData.date}
          disabled={isDisabled}
        />
      </div>

      {/* Fila: Descripción */}
      <div className="form-default-row">
        <TextInput
          label="Descripción"
          icon="AlignLeft"
          value={formData.description}
          placeholder="Notas adicionales..."
          onChange={(val) => onChange("description", val)}
          textarea
          disabled={isDisabled}
          name="loan-description"
        />
      </div>

      {/* Error del servidor */}
      <div className="form-default-row">
        {serverError && (
          <div className="error-banner">
            {serverError}
          </div>
        )}
      </div>

      {/* Botón de envío */}
      <SuccessToast 
        isSucces={isSuccess} 
        successText="Préstamo guardado con éxito."
      >
        <button 
          className="btn-submit" 
          type="submit" 
          disabled={isPending}
          aria-busy={isPending}
        >
          {isPending ? "Guardando..." : "Crear préstamo"}
        </button>
      </SuccessToast>
    </form>
  );
}