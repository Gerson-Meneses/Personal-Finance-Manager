import { useEffect } from "react";
import {
  Controller,
  useForm,
  useWatch,
} from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";
import dayjs from "dayjs";

import {
  DatePicker,
  TimePicker,
} from "../../../../shared/components/DateInput/DateInput";

import { SelectAccount } from "../../../accounts/components/selectAccount/selectAccount";
import SelectCategory from "../../../categories/components/selectCategory";

import { NumericInput } from "../../../../shared/components/NumericInput/NumericInput";
import { TextInput } from "../../../../shared/components/TextInput/TextInput";
import { TypeToggle } from "../../../../shared/components/TypeToggle/TypeToggle";
import { SuccessToast } from "../../../../shared/components/SuccesToast/SuccesToast";

import type {
  TransactionFormInput,
  TransactionDTO,
  Transaction,
  UpdateTransactionDTO,
  TransactionType,
} from "../../types";

import type { UseMutationResult } from "@tanstack/react-query";
import type { DataError } from "../../../../shared/dataApiInterface";

import { useTransactions } from "../../hooks";

import { transactionSchema } from "../../types";

import "./TransactionForm.css";

interface Fields {
  name?: boolean;
  type?: boolean;
  category?: boolean;
  account?: boolean;
  amount?: boolean;
  date?: boolean;
  time?: boolean;
  description?: boolean;
  all?: boolean;
  delete?: boolean;
}

interface PropsTransactionForm {
  mutation: UseMutationResult<
    Transaction,
    DataError<TransactionDTO>,
    TransactionDTO | UpdateTransactionDTO
  >;

  transaction?: Transaction;

  fieldsHidden?: Fields;
  fieldsDisabled?: Fields;

  isEdit?: boolean;

  onSuccess?: () => void;
}

const defaultValues: TransactionFormInput = {
  name: "",
  type: "EXPENSE",
  categoryId: "",
  accountId: "",
  amount: "",
  date: dayjs().format("YYYY-MM-DD"),
  time: dayjs().format("HH:mm"),
  description: "",
};

export default function TransactionForm({
  mutation,
  transaction,
  fieldsHidden,
  fieldsDisabled,
  isEdit,
  onSuccess,
}: PropsTransactionForm) {
  const { mutate, isPending, error } = mutation;

  const { deleteTransaction } = useTransactions();

  const {
    control,
    handleSubmit,
    reset,
    formState: {
      isDirty,
      isValid,
    },
  } = useForm<
    TransactionFormInput,
    unknown,
    TransactionDTO
  >({
    resolver: zodResolver(transactionSchema),
    mode: "onChange",
    defaultValues,
  });

  const transactionType = useWatch({
    control,
    name: "type",
  });

  const selectedDate = useWatch({
    control,
    name: "date",
  });

  console.log(mutation.isSuccess)

  useEffect(() => {
    if (!isEdit || !transaction) return;

    reset({
      name: transaction.name,
      type: transaction.type,
      categoryId: transaction.category?.id || "",
      accountId: transaction.account?.id || "",
      amount: String(transaction.amount),
      date: dayjs(transaction.date).format("YYYY-MM-DD"),
      time:
        transaction.time ||
        dayjs(transaction.date).format("HH:mm"),
      description: transaction.description || "",
    });

    mutation.reset()

  }, [isEdit, transaction, reset]);

  const onSubmit = (data: TransactionDTO) => {
    if (isEdit && transaction) {
      const updateData: UpdateTransactionDTO = {
        ...data,
        transactionId: transaction.id,
      };

      mutate(updateData, {
        onSuccess: () => {
          onSuccess?.();
        },
      });

      return;
    }

    mutate(data, {
      onSuccess: () => {
        reset(defaultValues);
        onSuccess?.();
      },
    });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="form-default-container"
    >
      <h2>
        {isEdit
          ? "Editar transacción"
          : "Crear nueva transacción"}
      </h2>

      {/* ================= TYPE ================= */}

      {!fieldsHidden?.type && (
        <div className="form-default-row">
          <Controller
            control={control}
            name="type"
            render={({ field, fieldState }) => (
              <TypeToggle<TransactionType>
                value={field.value}
                onChange={field.onChange}
                error={fieldState.error?.message}
                disabled={
                  isPending ||
                  fieldsDisabled?.type ||
                  fieldsDisabled?.all
                }
              />
            )}
          />
        </div>
      )}

      {/* ================= NAME / AMOUNT ================= */}

      <div className="form-default-row">
        {!fieldsHidden?.name && (
          <Controller
            control={control}
            name="name"
            render={({ field, fieldState }) => (
              <TextInput
                label="Nombre"
                icon="PencilLine"
                value={field.value}
                onChange={field.onChange}
                error={fieldState.error?.message}
                disabled={
                  isPending ||
                  fieldsDisabled?.name ||
                  fieldsDisabled?.all
                }
                required
              />
            )}
          />
        )}

        {!fieldsHidden?.amount && (
          <Controller
            control={control}
            name="amount"
            render={({ field, fieldState }) => (
              <NumericInput
                label="Monto"
                icon="CircleDollarSign"
                symbol="S/"
                value={field.value?.toString() ?? ""}
                onChange={field.onChange}
                error={fieldState.error?.message}
                disabled={
                  isPending ||
                  fieldsDisabled?.amount ||
                  fieldsDisabled?.all
                }
                required
              />
            )}
          />
        )}
      </div>

      {/* ================= CATEGORY / ACCOUNT ================= */}

      <div className="form-default-row">
        {!fieldsHidden?.category && (
          <Controller
            control={control}
            name="categoryId"
            render={({ field, fieldState }) => (
              <SelectCategory
                value={field.value}
                onChange={field.onChange}
                type={transactionType}
                error={fieldState.error?.message}
                disabled={
                  isPending ||
                  fieldsDisabled?.category ||
                  fieldsDisabled?.all
                }
                noLoan
                required
              />
            )}
          />
        )}

        {!fieldsHidden?.account && (
          <Controller
            control={control}
            name="accountId"
            render={({ field, fieldState }) => (
              <SelectAccount
              
                value={field.value}
                onChange={field.onChange}
                error={fieldState.error?.message}
                disabled={
                  isPending ||
                  fieldsDisabled?.account ||
                  fieldsDisabled?.all
                }
              />
            )}
          />
        )}
      </div>

      {/* ================= DATE / TIME ================= */}

      <div className="form-default-row">
        {!fieldsHidden?.date && (
          <Controller
            control={control}
            name="date"
            render={({ field, fieldState }) => (
              <DatePicker
                {...field}
                error={fieldState.error?.message}
              />
            )}
          />
        )}

        {!fieldsHidden?.time && (
          <Controller
            control={control}
            name="time"
            render={({ field, fieldState }) => (
              <TimePicker
                value={field.value}
                onChange={field.onChange}
                error={fieldState.error?.message}
                selectedDate={selectedDate}
                disabled={
                  isPending ||
                  fieldsDisabled?.time ||
                  fieldsDisabled?.all
                }
              />
            )}
          />
        )}
      </div>

      {/* ================= DESCRIPTION ================= */}

      <div className="form-default-row">
        {!fieldsHidden?.description && (
          <Controller
            control={control}
            name="description"
            render={({ field, fieldState }) => (
              <TextInput
                label="Descripción"
                icon="AlignLeft"
                value={field.value}
                onChange={field.onChange}
                error={fieldState.error?.message}
                placeholder="Notas adicionales..."
                textarea
                disabled={
                  isPending ||
                  fieldsDisabled?.description ||
                  fieldsDisabled?.all
                }
              />
            )}
          />
        )}
      </div>

      {/* ================= GLOBAL ERROR ================= */}

      {error && !error.details && (
        <div className="form-default-row">
          <div className="error-banner">
            {error.message ||
              "Ocurrió un error inesperado"}
          </div>
        </div>
      )}

      {/* ================= ACTIONS ================= */}

      <div className="form-default-row">
        {!fieldsDisabled?.all && (
          <SuccessToast
            successText={`${transactionType === "EXPENSE"
              ? "Gasto"
              : "Ingreso"
              } guardado con éxito.`}
            isSucces={mutation.isSuccess}
          >
            <button
              type="submit"
              className={`btn-submit ${transactionType.toLowerCase()}`}
              disabled={
                isPending ||
                !isDirty ||
                !isValid
              }
            >
              {isEdit ? "Actualizar" : "Crear"}
            </button>
          </SuccessToast>
        )}

        {(fieldsDisabled?.delete || isEdit) &&
          transaction && (
            <button
              type="button"
              className="btn-icon btn-icon-delete"
              onClick={() =>
                deleteTransaction.mutate(transaction.id)
              }
            >
              Eliminar
            </button>
          )}
      </div>
    </form>
  );
}