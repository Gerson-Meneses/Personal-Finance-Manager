import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { DatePicker, TimePicker } from "../../../../shared/components/DateInput/DateInput";
import { SelectAccount } from "../../../accounts/components/selectAccount/selectAccount";
import SelectCategory from "../../../categories/components/selectCategory";
import { NumericInput } from "../../../../shared/components/NumericInput/NumericInput";
import { TextInput } from "../../../../shared/components/TextInput/TextInput";
import './TransactionForm.css'
import type { CreateTransactionDTO, Transaction, TransactionType, UpdateTransactionDTO } from "../../types";
import type { UseMutationResult } from "@tanstack/react-query";
import type { DataError, DetailsError } from "../../../../shared/dataApiInterface";
import { handleFieldChange } from "../../../../shared/utils/handleFieldChange";
import { TypeToggle } from "../../../../shared/components/TypeToggle/TypeToggle";
import { validateInputsTransactionForm } from "./ValidateInputs";
import { SuccessToast } from "../../../../shared/components/SuccesToast/SuccesToast";

interface Fields {
  name?: boolean;
  type?: boolean;
  category?: boolean;
  account?: boolean;
  amount?: boolean;
  date?: boolean;
  time?: boolean;
  description?: boolean;
}

interface PropsTransactionForm {
  mutation: UseMutationResult<Transaction, DataError<CreateTransactionDTO>, CreateTransactionDTO | UpdateTransactionDTO>
  transaction?: Transaction;
  fieldsHidden?: Fields;
  fieldsDisabled?: Fields;
  isEdit?: boolean;
  onSuccess?: () => void;
}

export default function TransactionForm({ mutation, transaction, fieldsHidden, fieldsDisabled, isEdit, onSuccess }: PropsTransactionForm) {
  const { mutate, isPending, error, reset, isSuccess } = mutation;

  const [errors, setErrors] = useState<DetailsError<CreateTransactionDTO> | null>(null);

  const initialStateForm: CreateTransactionDTO = {
    name: "",
    type: "EXPENSE",
    categoryId: "",
    accountId: "",
    amount: 0,
    date: dayjs().format("YYYY-MM-DD"),
    time: dayjs().format("HH:mm"),
    description: ""
  };

  const [formData, setFormData] = useState<CreateTransactionDTO>(initialStateForm);

  useEffect(() => {
    if (isEdit && transaction) {
      setFormData({
        name: transaction.name,
        type: transaction.type,
        categoryId: transaction.category.id,
        accountId: transaction.account.id,
        amount: transaction.amount,
        date: dayjs(transaction.date).format("YYYY-MM-DD"),
        time: transaction.time || dayjs(transaction.date).format("HH:mm"),
        description: transaction.description || ""
      });
    }
  }, [isEdit, transaction]);

  useEffect(() => {
    if (isSuccess) {
      if (!isEdit) setFormData(initialStateForm);
      setErrors(null);
      reset();
    }
  }, [isSuccess, isEdit, reset]);


  useEffect(() => {
    console.log(isSuccess)
  }, [isSuccess])
  useEffect(() => {
    if (error?.details) {
      setErrors(error.details as DetailsError<CreateTransactionDTO>);
    }
  }, [error]);

  useEffect(() => {
    setErrors(null);
    reset();
  }, []);


  const onChange = <K extends keyof CreateTransactionDTO>(
    field: K,
    value: CreateTransactionDTO[K]
  ) => {
    handleFieldChange(field, value, setFormData, setErrors);
  };

  const getErrorMessage = (field: keyof CreateTransactionDTO) => {
    return errors?.[field] ? errors[field][0] : null;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors(null);

    if (isEdit && transaction) {
      const updateData: UpdateTransactionDTO = {
        ...formData,
        transactionId: transaction.id
      };
      const validationErrors = validateInputsTransactionForm({ ...formData }, transaction.id);
      if (validationErrors) {
        setErrors(validationErrors);
        return;
      }
      mutate(updateData);

    } else {
      const validationErrors = validateInputsTransactionForm(formData);
      if (validationErrors) {
        setErrors(validationErrors);
        return;
      }
      mutate(formData);
    }

    onSuccess && onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="form-default-container">
      <h2>{isEdit ? "Editar transacción" : "Crear nueva transacción"}</h2>

      <div className="form-default-row">

        {!fieldsHidden?.type && (
          <TypeToggle
            value={formData.type}
            onChange={(val) => onChange("type", val as TransactionType)}
            error={getErrorMessage("type")}
            disabled={isPending || fieldsDisabled?.type}
          />
        )}
      </div>

      <div className="form-default-row">

        {!fieldsHidden?.name && (<TextInput
          label="Nombre"
          icon="PencilLine"
          value={formData.name}
          onChange={(val) => onChange("name", val)}
          error={getErrorMessage("name")}
          disabled={isPending || fieldsDisabled?.name}
          required
        />)}

        {!fieldsHidden?.amount && <NumericInput
          label="Monto"
          icon="CircleDollarSign"
          symbol="S/"
          value={formData.amount}
          onChange={(val) => onChange("amount", val)}
          error={getErrorMessage("amount")}
          disabled={isPending || fieldsDisabled?.amount}
          required
        />}
      </div>

      <div className="form-default-row">
        {!fieldsHidden?.category && <SelectCategory
          value={formData.categoryId}
          type={formData.type}
          onChange={(val) => onChange("categoryId", val)}
          error={getErrorMessage("categoryId")}
          disabled={isPending || fieldsDisabled?.category}
          noLoan
          required
        />}

        {!fieldsHidden?.account && <SelectAccount
          value={formData.accountId}
          onChange={(val) => onChange("accountId", val)}
          error={getErrorMessage("accountId")}
          disabled={isPending || fieldsDisabled?.account}
        />}
      </div>


      <div className="form-default-row">
        {!fieldsHidden?.date && <DatePicker
          value={formData.date}
          onChange={(val) => onChange("date", val)}
          error={getErrorMessage("date")}
          disabled={isPending || fieldsDisabled?.date}
        />}

        {!fieldsHidden?.time && <TimePicker
          value={formData.time}
          onChange={(val) => onChange("time", val)}
          error={getErrorMessage("time")}
          selectedDate={formData.date}
          disabled={isPending || fieldsDisabled?.time}
        />}
      </div>

      <div className="form-default-row">
        {!fieldsHidden?.description && <TextInput
          label="Descripción"
          icon="AlignLeft"
          value={formData.description}
          placeholder="Notas adiconales..."
          onChange={(val) => onChange("description", val)}
          texarea
          disabled={isPending || fieldsDisabled?.description}
        />}
      </div>

      <div className="form-default-row">
        {error && !error.details && (
          <div className="error-banner">
            {error.message || "Ocurrió un error inesperado"}
          </div>
        )}
      </div>
      <div className="form-default-row">
        <SuccessToast successText={(formData.type ? "Gasto" : "Ingreso") + " guardado con exito."} isSucces={isSuccess}>
          <button type="submit" style={{ '--button-color': "#fff" } as React.CSSProperties} className={`form-default-button ${formData.type.toLowerCase()}`} disabled={isPending}>
            {isEdit ? "Actualizar" : "Crear"}
          </button>
        </SuccessToast>
      </div>
    </form>
  );
}