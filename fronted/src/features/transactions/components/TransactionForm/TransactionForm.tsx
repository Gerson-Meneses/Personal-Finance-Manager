import { useEffect } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import dayjs from "dayjs";
import {
  TrendingDown,
  TrendingUp,
  Trash2,
} from "lucide-react";

import { DatePicker, TimePicker } from "../../../../shared/components/DateInput/DateInput";
import { SelectAccount } from "../../../accounts/components/selectAccount/selectAccount";
import SelectCategory from "../../../categories/components/selectCategory";
import { NumericInput } from "../../../../shared/components/NumericInput/NumericInput";
import { TextInput } from "../../../../shared/components/TextInput/TextInput";
import { TypeToggle } from "../../../../shared/components/TypeToggle/TypeToggle";
import { SuccessToast } from "../../../../shared/components/SuccesToast/SuccesToast";
import { FormContainer } from "../../../../shared/components/FormContainer/FormContainer";

import {
  TransactionSchema,
  type TransactionInput,
  type TransactionOutput,
  type Transaction,
  type TransactionType,
  type UpdateTransactionOutput,
} from "../../types";

import type { UseMutationResult } from "@tanstack/react-query";
import type { DataError } from "../../../../shared/dataApiInterface";
import { useTransactions } from "../../hooks";

import "./TransactionForm.css";

/* ------------------------------------------------------------------ */
/*  Field visibility / disabled control                                 */
/* ------------------------------------------------------------------ */
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
    DataError<TransactionOutput>,
    TransactionOutput | UpdateTransactionOutput
  >;
  transaction?: Transaction;
  fieldsHidden?: Fields;
  fieldsDisabled?: Fields;
  isEdit?: boolean;
  onSuccess?: (transaction?: Transaction) => void;
  onClose?: () => void;
}

/* ------------------------------------------------------------------ */
/*  Defaults                                                            */
/* ------------------------------------------------------------------ */
const defaultValues: TransactionInput = {
  name: "",
  type: "EXPENSE",
  categoryId: "",
  accountId: "",
  amount: "",
  date: dayjs().format("YYYY-MM-DD"),
  time: dayjs().format("HH:mm"),
  description: "",
};

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */
export default function TransactionForm({
  mutation,
  transaction,
  fieldsHidden,
  fieldsDisabled,
  isEdit,
  onSuccess,
  onClose,
}: PropsTransactionForm) {
  const { mutate, isPending, error, isSuccess } = mutation;
  const { deleteTransaction } = useTransactions();

  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty, isValid },
  } = useForm<TransactionInput, unknown, TransactionOutput>({
    resolver: zodResolver(TransactionSchema),
    mode: "onChange",
    defaultValues,
  });

  const transactionType = useWatch({ control, name: "type" });
  const selectedDate = useWatch({ control, name: "date" });

  const isExpense = transactionType === "EXPENSE";
  const typeClass = isExpense ? "expense" : "income";
  const typeLabel = isExpense ? "Gasto" : "Ingreso";

  /* ---------- populate on edit ---------- */
  useEffect(() => {
    if (!isEdit || !transaction) return;
    reset({
      name: transaction.name,
      type: transaction.type,
      categoryId: transaction.category?.id || "",
      accountId: transaction.account?.id || "",
      amount: String(transaction.amount),
      date: dayjs(transaction.date).format("YYYY-MM-DD"),
      time: transaction.time || dayjs(transaction.date).format("HH:mm"),
      description: transaction.description || "",
    });
    mutation.reset();
  }, [isEdit, transaction, reset]);

  /* ---------- submit ---------- */
  const onSubmit = (data: TransactionOutput) => {
    if (isEdit && transaction) {
      const updateData: UpdateTransactionOutput = {
        ...data,
        transactionId: transaction.id,
      };
      mutate(updateData, { onSuccess: () => onSuccess?.() });
      return;
    }
    mutate(data, {
      onSuccess: () => {
        reset(defaultValues);
        onSuccess?.();
      },
    });
  };

  /* ---------- delete ---------- */
  const handleDelete = () => {
    if (!transaction) return;
    if (window.confirm("¿Seguro que deseas eliminar esta transacción?")) {
      deleteTransaction.mutate(transaction.id, {
        onSuccess: () => onClose?.(),
      });
    }
  };

  return (
    <FormContainer
      title={isEdit ? "Editar transacción" : "Nueva transacción"}
      icon={isExpense ? <TrendingDown size={20} /> : <TrendingUp size={20} />}
      error={error && !error.details ? (error.message || "Ocurrió un error inesperado") : null}
      className="max-w-2xl mx-auto"
      onClose={onClose}
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className={`form-default-container tx-form ${typeClass}`}
      >

        {/* ── TYPE TOGGLE ──────────────────────────────────────────── */}
        {!fieldsHidden?.type && (
          <Controller
            control={control}
            name="type"
            render={({ field, fieldState }) => (
              <TypeToggle<TransactionType>
                value={field.value}
                onChange={field.onChange}
                error={fieldState.error?.message}
                disabled={isPending || fieldsDisabled?.type || fieldsDisabled?.all}
                leftOption={{
                  value: "EXPENSE",
                  label: "Gasto",
                  color: "#993C1D",
                  icon: "TrendingDown",
                }}
                rightOption={{
                  value: "INCOME",
                  label: "Ingreso",
                  color: "#0F6E56",
                  icon: "TrendingUp",
                }}
              />
            )}
          />
        )}

        {/* ── NOMBRE + MONTO ───────────────────────────────────────── */}
        <div className="form-default-grid-2col">
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
                  placeholder="Ej. Almuerzo, Nómina…"
                  disabled={isPending || fieldsDisabled?.name || fieldsDisabled?.all}
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
                  disabled={isPending || fieldsDisabled?.amount || fieldsDisabled?.all}
                  required
                />
              )}
            />
          )}
        </div>

        {/* ── CATEGORÍA + CUENTA ───────────────────────────────────── */}
        <div className="form-default-grid-2col">
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
                  disabled={isPending || fieldsDisabled?.category || fieldsDisabled?.all}
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
                  disabled={isPending || fieldsDisabled?.account || fieldsDisabled?.all}
                />
              )}
            />
          )}
        </div>

        {/* ── FECHA + HORA ──────────────────────────────────────────── */}
        <div className="form-default-grid-2col">
          {!fieldsHidden?.date && (
            <Controller
              control={control}
              name="date"
              render={({ field, fieldState }) => (
                <DatePicker
                  value={field.value}
                  onChange={field.onChange}
                  error={fieldState.error?.message}
                  disabled={isPending || fieldsDisabled?.date || fieldsDisabled?.all}
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
                  disabled={isPending || fieldsDisabled?.time || fieldsDisabled?.all}
                />
              )}
            />
          )}
        </div>

        {/* ── DESCRIPCIÓN ───────────────────────────────────────────── */}
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
                placeholder="Notas adicionales…"
                textarea
                disabled={isPending || fieldsDisabled?.description || fieldsDisabled?.all}
              />
            )}
          />
        )}

        {/* ── ACTIONS ──────────────────────────────────────────────── */}
        <div className="form-default-row">
          {!fieldsDisabled?.all && (
            <SuccessToast
              successText={`${typeLabel} guardado con éxito.`}
              isSucces={isSuccess}
            >
              <button
                type="submit"
                className={`btn-submit tx ${typeClass}`}
                disabled={isPending || !isDirty || !isValid}
              >
                {isExpense
                  ? <TrendingDown size={14} />
                  : <TrendingUp size={14} />
                }
                {isEdit ? "Actualizar" : `Crear ${typeLabel.toLowerCase()}`}
              </button>
            </SuccessToast>
          )}

          {(fieldsDisabled?.delete || isEdit) && transaction && (
            <button
              type="button"
              className="btn-icon btn-icon-delete"
              disabled={deleteTransaction.isPending}
              onClick={handleDelete}
            >
              <Trash2 size={14} />
              {deleteTransaction.isPending ? "Eliminando…" : "Eliminar"}
            </button>
          )}
        </div>

      </form>
    </FormContainer>
  );
}