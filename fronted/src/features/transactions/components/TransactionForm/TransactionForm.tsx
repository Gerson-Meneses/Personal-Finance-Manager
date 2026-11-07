import { useEffect, useMemo, useRef } from "react";
import { Controller, useForm, useWatch, type Path } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import dayjs from "dayjs";
import {
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import { DatePicker, TimePicker } from "../../../../shared/components/DateInput/DateInput";
import { SelectAccount } from "../../../accounts/components/selectAccount/selectAccount";
import SelectCategory from "../../../categories/components/selectCategory";
import { useCategories, useCategorySuggestion } from "../../../categories/hooks";
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
import type { Category, CategorySuggestion } from "../../../categories/types";

import type { UseMutationResult } from "@tanstack/react-query";
import type { DataError } from "../../../../shared/dataApiInterface";

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
  defaultAccountId?: string;
}

/* ------------------------------------------------------------------ */
/*  Defaults                                                            */
/* ------------------------------------------------------------------ */
const createDefaultValues = (): TransactionInput => ({
  name: "",
  type: "EXPENSE",
  categoryId: "",
  accountId: "",
  amount: "",
  date: dayjs().format("YYYY-MM-DD"),
  time: dayjs().format("HH:mm"),
  description: "",
});

/** Campos reales del form — sirve para mapear error.details del backend */
const FORM_FIELDS = new Set<string>([
  "name", "type", "categoryId", "accountId", "amount", "date", "time", "description",
]);

/* ------------------------------------------------------------------ */
/*  Fallback local de sugerencia (sin historial en backend)            */
/* ------------------------------------------------------------------ */
const STOPWORDS = new Set([
  "de", "del", "la", "el", "los", "las", "y", "en", "con",
  "por", "para", "un", "una", "al", "a", "o",
]);

const normalizeText = (str: string) =>
  str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

const tokenizeText = (str: string) =>
  normalizeText(str)
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 2 && !STOPWORDS.has(t));

/** Palabras clave agrupadas por tema — se cruzan con el nombre de la categoría */
const KEYWORD_GROUPS: string[][] = [
  ["super", "mercado", "almacen", "supermerc", "abarrotes", "verduleria"],
  ["transporte", "uber", "taxi", "metro", "bus", "combustible", "gasolina", "parking", "estacionamiento", "peaje"],
  ["luz", "agua", "internet", "telefono", "celular", "gas", "electric", "servicio"],
  ["farmacia", "salud", "medico", "doctor", "hospital", "medic", "clinica"],
  ["restaurante", "almuerzo", "cena", "cafe", "resto", "pizza", "hamburguesa", "comida"],
  ["ropa", "zapato", "vestido", "calzado"],
  ["alquiler", "arriendo", "renta", "hipoteca"],
  ["educacion", "curso", "universidad", "colegio", "libro"],
  ["entretenimiento", "cine", "netflix", "spotify", "juego", "suscripcion", "streaming"],
  ["impuesto", "impuestos", "banco", "comision", "interes"],
  ["mascota", "veterinario", "perro", "gato"],
  ["regalo", "cumpleanos", "aniversario"],
];

const LOAN_CATEGORY_NAMES = new Set(["PRESTAMOS", "PRÉSTAMOS", "DEVOLUCIÓN DE PRÉSTAMO"]);

function suggestFromLocalHistory(
  query: string,
  type: TransactionType,
  categories: Category[]
): CategorySuggestion | null {
  const tokens = tokenizeText(query);
  if (query.trim().length < 2 || !tokens.length) return null;

  const candidates = categories.filter(
    (cat) => cat.type === type && !LOAN_CATEGORY_NAMES.has(cat.name)
  );

  let best: { cat: Category; score: number } | null = null;
  for (const cat of candidates) {
    const catTokens = new Set(tokenizeText(cat.name));
    let hits = 0;
    for (const token of tokens) {
      if (catTokens.has(token)) hits += 1;
    }
    let score = hits / tokens.length;

    if (score === 0) {
      const queryNorm = normalizeText(query);
      const catNorm = normalizeText(cat.name);
      for (const group of KEYWORD_GROUPS) {
        const queryHitsGroup = group.some((k) => queryNorm.includes(k));
        const categoryHitsGroup = group.some((k) => catNorm.includes(k));
        if (queryHitsGroup && categoryHitsGroup) {
          score = 0.6;
          break;
        }
      }
    }

    if (score >= 0.5 && (!best || score > best.score)) {
      best = { cat, score };
    }
  }

  if (!best) return null;
  return {
    id: best.cat.id,
    name: best.cat.name,
    color: best.cat.color,
    icon: best.cat.icon ?? null,
    type: best.cat.type,
  };
}

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
  defaultAccountId,
}: PropsTransactionForm) {
  const { mutate, isPending, error, isSuccess } = mutation;

  const initialValues = useMemo<TransactionInput>(() => ({
    ...createDefaultValues(),
    accountId: defaultAccountId ?? "",
  }), [defaultAccountId]);

  const {
    control,
    handleSubmit,
    reset,
    trigger,
    setError,
    setValue,
    getValues,
    clearErrors,
    formState: { isDirty, isValid },
  } = useForm<TransactionInput, unknown, TransactionOutput>({
    resolver: zodResolver(TransactionSchema),
    mode: "onChange",
    defaultValues: initialValues,
  });

  const transactionType = useWatch({ control, name: "type" });
  const selectedDate = useWatch({ control, name: "date" });
  const transactionName = useWatch({ control, name: "name" }) ?? "";

  const isExpense = transactionType === "EXPENSE";
  const typeClass = isExpense ? "expense" : "income";
  const typeLabel = isExpense ? "Gasto" : "Ingreso";

  /* ---------- categoría sugerida (historial) ---------- */
  const autoCategoryIdRef = useRef<string | null>(null);

  const trimmedName = transactionName.trim();
  const suggestionEnabled =
    !fieldsHidden?.category &&
    !fieldsDisabled?.category &&
    !fieldsDisabled?.all;

  const suggestionQuery = useCategorySuggestion(
    trimmedName,
    transactionType,
    suggestionEnabled
  );
  const { categories } = useCategories();
  // SelectCategory usa noLoan: descartamos sugerencias de categorías de
  // préstamo para no auto-seleccionar un valor que no está en las opciones.
  const backendSuggestion = useMemo<CategorySuggestion | null>(() => {
    const s = suggestionQuery.data?.suggestion;
    if (!s) return null;
    const cat = categories.find((c) => c.id === s.id);
    if (!cat || LOAN_CATEGORY_NAMES.has(cat.name)) return null;
    return s;
  }, [suggestionQuery.data, categories]);

  // Fallback local cuando el backend no encuentra historial (o falla)
  const localSuggestion = useMemo<CategorySuggestion | null>(() => {
    if (!suggestionEnabled) return null;
    if (!suggestionQuery.isSuccess && !suggestionQuery.isError) return null;
    if (backendSuggestion) return null;
    return suggestFromLocalHistory(trimmedName, transactionType, categories);
  }, [
    suggestionEnabled,
    suggestionQuery.isSuccess,
    suggestionQuery.isError,
    backendSuggestion,
    trimmedName,
    transactionType,
    categories,
  ]);

  const visibleSuggestion = backendSuggestion ?? localSuggestion;

  // Aplica la sugerencia solo si el usuario no eligió una categoría manualmente
  // (valor vacío o valor puesto por nosotros).
  useEffect(() => {
    if (!visibleSuggestion) return;
    const current = getValues("categoryId");
    if (current && current !== autoCategoryIdRef.current) return;
    if (current === visibleSuggestion.id) {
      autoCategoryIdRef.current = visibleSuggestion.id;
      return;
    }
    autoCategoryIdRef.current = visibleSuggestion.id;
    setValue("categoryId", visibleSuggestion.id, {
      shouldValidate: true,
      shouldDirty: true,
    });
  }, [visibleSuggestion, getValues, setValue]);

  /* ---------- cambiar tipo → limpiar categoría ---------- */
  // SelectCategory filtra por tipo: si el usuario cambia Gasto↔Ingreso,
  // la categoría elegida ya no está en las opciones pero sigue en el form
  // (pasaría la validación uuid). La limpiamos para forzar una nueva elección.
  const handleTypeChange = (newType: TransactionType) => {
    if (newType !== transactionType) {
      autoCategoryIdRef.current = null;
      setValue("categoryId", "");
    }
  };

  /* ---------- errores del servidor → campos ---------- */
  const hasDetails = !!error?.details && Object.keys(error.details).length > 0;

  useEffect(() => {
    if (!error?.details) return;
    (Object.entries(error.details) as [string, string[]][]).forEach(([field, messages]) => {
      if (!messages?.length || !FORM_FIELDS.has(field)) return;
      setError(field as Path<TransactionInput>, {
        type: "server",
        message: messages[0],
      });
    });
  }, [error, setError]);

  // Banner solo si hay error sin details (los details van campo por campo)
  // o si algún detail no correspondió a un campo del form.
  const unmappedDetails = error?.details
    ? Object.entries(error.details)
        .filter(([field]) => !FORM_FIELDS.has(field))
        .flatMap(([, messages]) => messages)
    : [];
  const bannerError = error
    ? (unmappedDetails.length
        ? unmappedDetails.join(" · ")
        : hasDetails
          ? null
          : (error.message || "Ocurrió un error inesperado"))
    : null;


  /* ---------- populate on edit ---------- */
  useEffect(() => {
    if (!isEdit || !transaction) return;
    autoCategoryIdRef.current = null;
    reset({
      name: transaction.name,
      type: transaction.type,
      categoryId: transaction.category?.id || "",
      accountId: transaction.account?.id || "",
      amount: String(transaction.amount),
      date: dayjs(transaction.date).format("YYYY-MM-DD"),
      // El backend devuelve "HH:mm:ss"; el input y el schema usan "HH:mm"
      time: transaction.time
        ? transaction.time.slice(0, 5)
        : dayjs(transaction.date).format("HH:mm"),
      description: transaction.description || "",
    });
    // reset() no revalida: sin esto isValid queda en false y el botón
    // "Actualizar" seguiría deshabilitado hasta tocar un campo.
    trigger();
    mutation.reset();
  }, [isEdit, transaction, reset, trigger]);

  /* ---------- submit ---------- */
  const onSubmit = (data: TransactionOutput) => {
    // handleSubmit ya validó: cualquier error que quede es "server" stale
    // de un intento anterior. Lo limpiamos antes del nuevo intento.
    clearErrors();
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
        reset(initialValues);
        onSuccess?.();
      },
    });
  };

  return (
    <>
      <FormContainer
        title={isEdit ? "Editar transacción" : "Nueva transacción"}
        icon={isExpense ? <TrendingDown size={20} /> : <TrendingUp size={20} />}
        error={bannerError}
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
                onChange={(value) => {
                  handleTypeChange(value);
                  field.onChange(value);
                }}
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
                  onChange={(value) => {
                    // Elección manual (incluye crear una categoría nueva):
                    // anula la selección automática de la sugerencia.
                    autoCategoryIdRef.current = null;
                    field.onChange(value);
                  }}
                  type={transactionType}
                  defaultName={trimmedName}
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
        <div className="form-default-row form-actions-container">
          {!fieldsDisabled?.all && (
            <SuccessToast
              successText={`${typeLabel} guardado con éxito.`}
              isSucces={isSuccess}
            >
              <button
                type="submit"
                className={`btn-submit tx ${typeClass}`}
                disabled={isPending || !isValid || (!isEdit && !isDirty)}
              >
                {isExpense
                  ? <TrendingDown size={14} />
                  : <TrendingUp size={14} />
                }
                {isEdit ? "Actualizar" : `Crear ${typeLabel.toLowerCase()}`}
              </button>
            </SuccessToast>
          )}
        </div>

      </form>
      </FormContainer>
    </>
  );
}