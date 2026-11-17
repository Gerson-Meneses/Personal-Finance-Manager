import { useEffect, useMemo, useRef, useState } from "react";
import { Controller, useFieldArray, useForm, useWatch, type Path } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import dayjs from "dayjs";
import {
  Download,
  FileText,
  Loader2,
  Package,
  Paperclip,
  Plus,
  Split,
  Store,
  Trash2,
  TrendingDown,
  TrendingUp,
  Upload,
} from "lucide-react";

import { DatePicker, TimePicker } from "../../../../shared/components/DateInput/DateInput";
import { SelectAccount } from "../../../accounts/components/selectAccount/selectAccount";
import SelectCategory from "../../../categories/components/selectCategory";
import { useCategories, useCategorySuggestion } from "../../../categories/hooks";
import { NumericInput } from "../../../../shared/components/NumericInput/NumericInput";
import { TextInput } from "../../../../shared/components/TextInput/TextInput";
import { TypeToggle } from "../../../../shared/components/TypeToggle/TypeToggle";
import { FormContainer } from "../../../../shared/components/FormContainer/FormContainer";
import { useToast } from "../../../../shared/Hooks/useToast";
import { TagSelector } from "../../../tags/components/TagSelector";
import { useTransactionAttachments } from "../../../attachments/hooks";
import * as attachmentService from "../../../attachments/services";
import { scanReceiptFile } from "../../../receipts/scan";
import {
  MAX_RECEIPT_INPUT_SIZE,
  type ReceiptScanProgress,
  type ReceiptScanResult,
} from "../../../receipts/types";
import { ReceiptScanner } from "../../../receipts/components/ReceiptScanner";
import { formatCurrency } from "../../../../shared/utils/formatCurrency";

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
const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024;

/**
 * La división de transacciones queda implementada en backend y en estado,
 * pero oculta en la UI hasta que se decida integrarla.
 */
const SPLITS_UI_ENABLED = false;

const createDefaultValues = (): TransactionInput => ({
  name: "",
  type: "EXPENSE",
  categoryId: "",
  accountId: "",
  amount: "",
  date: dayjs().format("YYYY-MM-DD"),
  time: dayjs().format("HH:mm"),
  description: "",
  tagIds: [],
  splits: [],
  merchantName: "",
  merchantAddress: "",
  merchantRuc: "",
  items: [],
});

/** Campos reales del form — sirve para mapear error.details del backend */
const FORM_FIELDS = new Set<string>([
  "name", "type", "categoryId", "accountId", "amount", "date", "time", "description",
  "tagIds", "splits", "merchantName", "merchantAddress", "merchantRuc", "items",
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
  const { mutate, isPending, error } = mutation;
  const toast = useToast();

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

  const queryClient = useQueryClient();
  const [splitEnabled, setSplitEnabled] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState<ReceiptScanProgress | null>(null);
  const [scanResult, setScanResult] = useState<ReceiptScanResult | null>(null);
  const attachmentsApi = useTransactionAttachments(isEdit ? transaction?.id : undefined);
  const {
    fields: splitFields,
    append: appendSplit,
    remove: removeSplit,
    replace: replaceSplits,
  } = useFieldArray({ control, name: "splits" });
  const {
    fields: itemFields,
    append: appendItem,
    remove: removeItem,
    replace: replaceItems,
  } = useFieldArray({ control, name: "items" });

  const transactionType = useWatch({ control, name: "type" });
  const amountValue = useWatch({ control, name: "amount" });
  const splitsValue = useWatch({ control, name: "splits" }) ?? [];
  const itemsValue = useWatch({ control, name: "items" }) ?? [];
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
      const currentSplits = getValues("splits") ?? [];
      if (currentSplits.length) {
        replaceSplits(
          currentSplits.map((split) => ({ ...split, categoryId: "" }))
        );
      }

      if (newType === "INCOME") {
        replaceItems([]);
        setValue("merchantName", "");
        setValue("merchantAddress", "");
        setValue("merchantRuc", "");
      }
    }
  };

  /* ---------- divisiones ---------- */
  const parseAmount = (value: unknown) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const totalAmount = parseAmount(amountValue);
  const assignedAmount = splitsValue.reduce(
    (sum, split) => sum + parseAmount(split?.amount),
    0
  );
  const splitRemaining = Math.round((totalAmount - assignedAmount) * 100) / 100;

  const toggleSplit = () => {
    if (splitEnabled) {
      replaceSplits([]);
      setSplitEnabled(false);
      return;
    }

    setSplitEnabled(true);
    if ((getValues("splits") ?? []).length === 0) {
      const currentAmount = getValues("amount");
      appendSplit({
        categoryId: getValues("categoryId") || "",
        amount: currentAmount ? String(currentAmount) : "",
        description: "",
        tagIds: [],
      });
    }
  };

  const addSplit = () => {
    appendSplit({
      categoryId: "",
      amount: splitRemaining > 0 ? String(splitRemaining) : "",
      description: "",
      tagIds: [],
    });
  };

  /* ---------- adjuntos ---------- */
  const addFiles = (fileList: FileList | null) => {
    if (!fileList) return;

    for (const file of Array.from(fileList)) {
      if (file.size > MAX_ATTACHMENT_SIZE) {
        toast.error(`${file.name} supera el límite de 5 MB`);
        continue;
      }

      if (isEdit && transaction) {
        attachmentsApi.uploadAttachment.mutate(
          { transactionId: transaction.id, file },
          {
            onSuccess: () => toast.success("Adjunto subido"),
            onError: (uploadError) => toast.error(uploadError.message || "No se pudo subir el adjunto"),
          }
        );
      } else {
        setPendingFiles((previous) => [...previous, file]);
      }
    }
  };

  /* ---------- escaneo de boletas ---------- */
  const attachReceiptFile = (file: File) => {
    if (isEdit && transaction) {
      attachmentsApi.uploadAttachment.mutate(
        { transactionId: transaction.id, file },
        {
          onSuccess: () => toast.success("Imagen de la boleta adjuntada"),
          onError: (uploadError) =>
            toast.error(uploadError.message || "No se pudo adjuntar la imagen de la boleta"),
        }
      );
      return;
    }

    setPendingFiles((previous) => [...previous, file]);
  };

  const handleScanFile = async (file: File) => {
    if (file.size > MAX_RECEIPT_INPUT_SIZE) {
      toast.error("El documento es demasiado grande (máximo 25 MB).");
      return;
    }

    setScanning(true);
    setScanProgress(null);
    setScanResult(null);

    try {
      const { file: attachment, result } = await scanReceiptFile(file, setScanProgress);
      setScanResult(result);

      if (attachment.size <= MAX_ATTACHMENT_SIZE) {
        attachReceiptFile(attachment);
      } else {
        toast.info("La boleta se escaneó, pero el archivo supera 5 MB y no se adjuntará.");
      }

      let filled = 0;

      if (result.merchantName) {
        setValue("merchantName", result.merchantName, {
          shouldDirty: true,
          shouldValidate: true,
        });

        if (!String(getValues("name") ?? "").trim()) {
          setValue("name", result.merchantName, {
            shouldDirty: true,
            shouldValidate: true,
          });
          filled += 1;
        }
      }

      if (result.merchantAddress) {
        setValue("merchantAddress", result.merchantAddress, {
          shouldDirty: true,
          shouldValidate: true,
        });
      }

      if (result.merchantRuc) {
        setValue("merchantRuc", result.merchantRuc, {
          shouldDirty: true,
          shouldValidate: true,
        });
      }

      if (result.amount !== null && !String(getValues("amount") ?? "").trim()) {
        setValue("amount", result.amount, { shouldDirty: true, shouldValidate: true });
        filled += 1;
      }

      if (result.date) {
        setValue("date", result.date, { shouldDirty: true, shouldValidate: true });
        filled += 1;
      }

      if (result.items.length > 0) {
        replaceItems(
          result.items.map((item) => ({
            name: item.name,
            quantity: String(item.quantity),
            unitPrice: String(item.unitPrice),
          }))
        );
        filled += 1;
      }

      if (result.warning) {
        toast.info(result.warning);
      } else if (filled > 0) {
        toast.success("Boleta escaneada. Revisa los datos antes de guardar.");
      } else {
        toast.info("Boleta adjuntada. No se detectaron campos nuevos.");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No se pudo escanear la boleta"
      );
    } finally {
      setScanning(false);
      setScanProgress(null);
    }
  };

  const addPurchaseItem = () => {
    appendItem({ name: "", quantity: "1", unitPrice: "" });
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
      tagIds: transaction.tags?.map((tag) => tag.id) ?? [],
      splits: transaction.splits?.map((split) => ({
        categoryId: split.category?.id || "",
        amount: String(split.amount),
        description: split.description || "",
        tagIds: split.tags?.map((tag) => tag.id) ?? [],
      })) ?? [],
      merchantName: transaction.merchantName || "",
      merchantAddress: transaction.merchantAddress || "",
      merchantRuc: transaction.merchantRuc || "",
      items: transaction.items?.map((item) => ({
        name: item.name,
        quantity: String(item.quantity),
        unitPrice: String(item.unitPrice),
      })) ?? [],
    });
    setSplitEnabled((transaction.splits?.length ?? 0) > 0);
    setPendingFiles([]);
    setScanResult(null);
    setScanProgress(null);
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

    const categoryId = data.categoryId?.trim() ? data.categoryId : undefined;
    const splits = data.splits?.length
      ? data.splits.map((split) => ({
          ...split,
          tagIds: split.tagIds?.length ? split.tagIds : undefined,
        }))
      : undefined;

    if (!splits && !categoryId) {
      toast.error("Selecciona una categoría o divide la transacción.");
      return;
    }

    if (splits) {
      const splitTotal = splits.reduce((sum, split) => sum + Number(split.amount), 0);
      const total = Number(data.amount);
      if (Math.abs(splitTotal - total) > 0.009) {
        toast.error(
          `La suma de las divisiones (${formatCurrency(splitTotal)}) debe ser igual al monto (${formatCurrency(total)}).`
        );
        return;
      }
    }

    const items = data.items?.length
      ? data.items.map((item) => ({
          name: item.name.trim(),
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
        }))
      : undefined;

    const merchantName = data.merchantName?.trim() || undefined;
    const merchantAddress = data.merchantAddress?.trim() || undefined;
    const merchantRuc = data.merchantRuc?.trim() || undefined;

    const basePayload = {
      ...data,
      categoryId,
      tagIds: data.tagIds?.length ? data.tagIds : undefined,
      splits,
      merchantName,
      merchantAddress,
      merchantRuc,
      items,
    };

    if (isEdit && transaction) {
      const updateData: UpdateTransactionOutput = {
        ...basePayload,
        transactionId: transaction.id,
        // Un array vacío borra las etiquetas/divisiones/productos existentes.
        tagIds: data.tagIds ?? [],
        splits: splits ?? [],
        merchantName: data.merchantName?.trim() ?? "",
        merchantAddress: data.merchantAddress?.trim() ?? "",
        merchantRuc: data.merchantRuc?.trim() ?? "",
        items: items ?? [],
      };
      mutate(updateData, {
        onSuccess: (updated) => {
          toast.success("Transacción actualizada");
          onSuccess?.(updated);
        },
      });
      return;
    }

    mutate(basePayload, {
      onSuccess: async (created) => {
        if (pendingFiles.length > 0 && created?.id) {
          setUploading(true);
          try {
            for (const file of pendingFiles) {
              await attachmentService.uploadAttachment(created.id, file);
            }
            queryClient.invalidateQueries({ queryKey: ["attachments", created.id] });
            queryClient.invalidateQueries({ queryKey: ["transactions"] });
          } catch {
            toast.error("La transacción se creó, pero algún adjunto no se pudo subir.");
          } finally {
            setUploading(false);
          }
        }

        toast.success(`${typeLabel} registrado`);
        reset(initialValues);
        setPendingFiles([]);
        setSplitEnabled(false);
        setScanResult(null);
        setScanProgress(null);
        onSuccess?.(created);
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

        {/* ── ESCANEAR BOLETA ──────────────────────────────────────── */}
        {!fieldsDisabled?.all && isExpense && (
          <ReceiptScanner
            disabled={isPending}
            scanning={scanning}
            progress={scanProgress}
            result={scanResult}
            onFileSelected={(file) => void handleScanFile(file)}
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

        {/* ── ESTABLECIMIENTO Y PRODUCTOS ─────────────────────────── */}
        {!fieldsHidden?.category && !fieldsDisabled?.all && isExpense && (
          <div className="tx-purchase">
            <div className="tx-purchase__head">
              <span className="tx-purchase__title">
                <Store size={14} />
                Establecimiento y productos
              </span>
              <span className="tx-purchase__badge">Opcional</span>
            </div>

            <div className="form-default-grid-2col">
              <Controller
                control={control}
                name="merchantName"
                render={({ field, fieldState }) => (
                  <TextInput
                    label="Establecimiento"
                    icon="Store"
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    error={fieldState.error?.message}
                    placeholder="Ej. Promart, Metro…"
                    disabled={isPending}
                  />
                )}
              />

              <Controller
                control={control}
                name="merchantRuc"
                render={({ field, fieldState }) => (
                  <TextInput
                    label="RUC"
                    icon="Hash"
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    error={fieldState.error?.message}
                    placeholder="11 dígitos"
                    disabled={isPending}
                  />
                )}
              />
            </div>

            <Controller
              control={control}
              name="merchantAddress"
              render={({ field, fieldState }) => (
                <TextInput
                  label="Dirección"
                  icon="MapPin"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  error={fieldState.error?.message}
                  placeholder="Av. Aviación 2405, San Borja…"
                  disabled={isPending}
                />
              )}
            />

            <div className="tx-purchase__items-head">
              <span className="tx-purchase__subtitle">
                <Package size={14} />
                Productos comprados
              </span>
              <button
                type="button"
                className="tx-purchase__add"
                onClick={addPurchaseItem}
                disabled={isPending}
              >
                <Plus size={13} />
                Agregar producto
              </button>
            </div>

            {itemFields.length > 0 ? (
              <div className="tx-purchase__items">
                {itemFields.map((field, index) => {
                  const quantity = Number(itemsValue[index]?.quantity ?? 0);
                  const unitPrice = Number(itemsValue[index]?.unitPrice ?? 0);
                  const lineTotal = quantity * unitPrice;

                  return (
                    <div key={field.id} className="tx-purchase__item">
                      <Controller
                        control={control}
                        name={`items.${index}.name` as Path<TransactionInput>}
                        render={({ field: nameField, fieldState }) => (
                          <TextInput
                            label="Producto"
                            icon="Package"
                            value={String(nameField.value ?? "")}
                            onChange={nameField.onChange}
                            error={fieldState.error?.message}
                            placeholder="Ej. Abrigo con capucha"
                            disabled={isPending}
                          />
                        )}
                      />

                      <Controller
                        control={control}
                        name={`items.${index}.quantity` as Path<TransactionInput>}
                        render={({ field: quantityField, fieldState }) => (
                          <NumericInput
                            label="Cant."
                            icon="Hash"
                            value={String(quantityField.value ?? "")}
                            onChange={quantityField.onChange}
                            error={fieldState.error?.message}
                            disabled={isPending}
                            min={0}
                          />
                        )}
                      />

                      <Controller
                        control={control}
                        name={`items.${index}.unitPrice` as Path<TransactionInput>}
                        render={({ field: priceField, fieldState }) => (
                          <NumericInput
                            label="Precio unit."
                            symbol="S/"
                            icon={null}
                            value={String(priceField.value ?? "")}
                            onChange={priceField.onChange}
                            error={fieldState.error?.message}
                            disabled={isPending}
                            min={0}
                          />
                        )}
                      />

                      <span
                  className="tx-purchase__total tooltip-anchor tooltip-top"
                  data-tooltip="Total de la línea"
                >
                        {formatCurrency(lineTotal)}
                      </span>

                      <button
                        type="button"
                        className="tx-purchase__remove"
                        onClick={() => removeItem(index)}
                        disabled={isPending}
                        aria-label="Quitar producto"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="tx-purchase__empty">
                Agrega productos para llevar un historial de precios por establecimiento.
              </p>
            )}
          </div>
        )}

        {/* ── DIVISIÓN EN CATEGORÍAS ────────────────────────────────── */}
        {SPLITS_UI_ENABLED && !fieldsHidden?.category && !fieldsDisabled?.all && (
          <div className="tx-split-section">
            <div className="tx-split-toggle">
              <button
                type="button"
                className={`tx-split-toggle__btn ${splitEnabled ? "is-active" : ""}`}
                onClick={toggleSplit}
                disabled={isPending || uploading}
              >
                <Split size={14} />
                {splitEnabled ? "Quitar división" : "Dividir transacción"}
              </button>

              {splitEnabled && (
                <span
                  className={`tx-split-summary ${Math.abs(splitRemaining) > 0.009 ? "is-mismatch" : "is-ok"}`}
                >
                  Asignado {formatCurrency(assignedAmount)} / {formatCurrency(totalAmount)}
                  {Math.abs(splitRemaining) > 0.009 && ` · Falta ${formatCurrency(splitRemaining)}`}
                </span>
              )}
            </div>

            {splitEnabled && (
              <div className="tx-split-list">
                {splitFields.map((field, index) => {
                  const splitError = (error?.details as Record<string, string[]> | undefined)?.[`splits.${index}`];
                  return (
                    <div key={field.id} className="tx-split-row">
                      <Controller
                        control={control}
                        name={`splits.${index}.categoryId` as Path<TransactionInput>}
                        render={({ field: categoryField, fieldState }) => (
                          <SelectCategory
                            label="Categoría"
                            value={String(categoryField.value ?? "")}
                            onChange={categoryField.onChange}
                            type={transactionType}
                            noLoan
                            error={fieldState.error?.message}
                            disabled={isPending}
                          />
                        )}
                      />

                      <Controller
                        control={control}
                        name={`splits.${index}.amount` as Path<TransactionInput>}
                        render={({ field: amountField, fieldState }) => (
                          <NumericInput
                            label="Monto"
                            symbol="S/"
                            value={String(amountField.value ?? "")}
                            onChange={amountField.onChange}
                            error={fieldState.error?.message}
                            disabled={isPending}
                          />
                        )}
                      />

                      <Controller
                        control={control}
                        name={`splits.${index}.description` as Path<TransactionInput>}
                        render={({ field: descriptionField, fieldState }) => (
                          <TextInput
                            label="Detalle"
                            icon="AlignLeft"
                            value={(descriptionField.value as string | undefined) ?? ""}
                            onChange={descriptionField.onChange}
                            error={fieldState.error?.message}
                            placeholder="Opcional"
                            disabled={isPending}
                          />
                        )}
                      />

                      <button
                        type="button"
                        className="tx-split-row__remove"
                        onClick={() => removeSplit(index)}
                        disabled={isPending || splitFields.length <= 1}
                        aria-label="Quitar división"
                      >
                        <Trash2 size={14} />
                      </button>

                      {splitError && (
                        <span className="error-text">
                          {splitError[0]}
                        </span>
                      )}
                    </div>
                  );
                })}

                <div className="tx-split-actions">
                  <button
                    type="button"
                    className="tx-split-add"
                    onClick={addSplit}
                    disabled={isPending}
                  >
                    <Plus size={14} />
                    Agregar división
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── ETIQUETAS ─────────────────────────────────────────────── */}
        {!fieldsHidden?.category && !fieldsDisabled?.all && (
          <Controller
            control={control}
            name="tagIds"
            render={({ field, fieldState }) => (
              <TagSelector
                label="Etiquetas"
                value={Array.isArray(field.value) ? (field.value as string[]) : []}
                onChange={field.onChange}
                disabled={isPending || uploading}
                error={fieldState.error?.message}
              />
            )}
          />
        )}

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

        {/* ── ADJUNTOS ─────────────────────────────────────────────── */}
        {!fieldsDisabled?.all && (
          <div className="tx-attachments">
            <div className="tx-attachments__head">
              <span className="input-label">
                <Paperclip size={14} />
                Adjuntos
              </span>
              <span className="tx-attachments__count">
                {isEdit ? attachmentsApi.attachments.length : pendingFiles.length}
              </span>
            </div>

            <div className="tx-attachments__list">
              {isEdit && attachmentsApi.loading && (
                <span className="tx-attachments__empty">Cargando adjuntos…</span>
              )}

              {isEdit && attachmentsApi.attachments.map((attachment) => (
                <div key={attachment.id} className="tx-attachment">
                  <FileText size={14} />
                  <span
                    className="tx-attachment__name tooltip-anchor tooltip-top tooltip-wide"
                    data-tooltip={attachment.fileName}
                  >
                    {attachment.fileName}
                  </span>
                  <span className="tx-attachment__size">
                    {Math.max(1, Math.round(attachment.size / 1024))} KB
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      void attachmentService
                        .downloadAttachment(attachment)
                        .catch((downloadError) =>
                          toast.error(
                            downloadError instanceof Error
                              ? downloadError.message
                              : "No se pudo descargar el adjunto"
                          )
                        );
                    }}
                    aria-label={`Descargar ${attachment.fileName}`}
                    data-tooltip="Descargar"
                    className="tx-attachment__action tooltip-left"
                  >
                    <Download size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      attachmentsApi.deleteAttachment.mutate(attachment.id, {
                        onSuccess: () => toast.success("Adjunto eliminado"),
                        onError: (deleteError) =>
                          toast.error(deleteError.message || "No se pudo eliminar el adjunto"),
                      });
                    }}
                    aria-label={`Eliminar ${attachment.fileName}`}
                    data-tooltip="Eliminar"
                    className="tx-attachment__action is-danger tooltip-left"
                    disabled={attachmentsApi.deleteAttachment.isPending}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}

              {!isEdit && pendingFiles.map((file, index) => (
                <div key={`${file.name}-${index}`} className="tx-attachment">
                  <FileText size={14} />
                  <span
                    className="tx-attachment__name tooltip-anchor tooltip-top tooltip-wide"
                    data-tooltip={file.name}
                  >
                    {file.name}
                  </span>
                  <span className="tx-attachment__size">
                    {Math.max(1, Math.round(file.size / 1024))} KB
                  </span>
                  <button
                    type="button"
                    onClick={() => setPendingFiles((previous) => previous.filter((_, i) => i !== index))}
                    aria-label={`Quitar ${file.name}`}
                    data-tooltip="Quitar"
                    className="tx-attachment__action is-danger tooltip-left"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}

              {((isEdit && attachmentsApi.attachments.length === 0) || (!isEdit && pendingFiles.length === 0)) && (
                <span className="tx-attachments__empty">Sin adjuntos</span>
              )}
            </div>

            <label className="tx-attachments__upload">
              {uploading || attachmentsApi.uploadAttachment.isPending ? (
                <Loader2 size={14} className="tx-attachments__spinner" />
              ) : (
                <Upload size={14} />
              )}
              Agregar archivo
              <input
                type="file"
                multiple
                hidden
                disabled={isPending || uploading}
                onChange={(event) => {
                  addFiles(event.target.files);
                  event.target.value = "";
                }}
              />
            </label>

            <p className="tx-attachments__hint text-muted">
              Máximo 5 MB por archivo. Imágenes, PDF, documentos y hojas de cálculo.
            </p>
          </div>
        )}

        {/* ── ACTIONS ──────────────────────────────────────────────── */}
        <div className="form-default-row form-actions-container">
          {!fieldsDisabled?.all && (
            <button
              type="submit"
              className={`btn-submit tx ${typeClass}`}
              disabled={isPending || uploading || !isValid || (!isEdit && !isDirty)}
            >
              {isExpense
                ? <TrendingDown size={14} />
                : <TrendingUp size={14} />
              }
              {isEdit ? "Actualizar" : `Crear ${typeLabel.toLowerCase()}`}
            </button>
          )}
        </div>

      </form>
      </FormContainer>
    </>
  );
}