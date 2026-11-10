import { useEffect, useRef, useState } from "react";
import {
    CategorySchema,
    type Category,
    type CategorySchemaInput,
    type CategorySchemaOutput,
    type UpdateCategoryInput,
} from "../../types";
import type { UseMutationResult } from "@tanstack/react-query";
import type { DataError } from "../../../../shared/dataApiInterface";
import { TypeToggle } from "../../../../shared/components/TypeToggle/TypeToggle";
import { TextInput } from "../../../../shared/components/TextInput/TextInput";
import { ColorPicker } from "../../../../shared/components/ColorPicker/ColorPicker";
import { IconPicker } from "../../../../shared/components/IconPicker/IconPicker";
import { useToast } from "../../../../shared/Hooks/useToast";
import { FormContainer } from "../../../../shared/components/FormContainer/FormContainer";
import InfoModal from "../../../../shared/components/InfoModal/InfoModal";
import { useCategories } from "../../hooks";
import { suggestCategoryStyle } from "../../styleSuggestion";
import { Controller, useForm, useWatch, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import "./CategoryForm.css";
import {
    TrendingUp,
    TrendingDown,
    Trash2,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Props                                                               */
/* ------------------------------------------------------------------ */
interface PropsCategoryForm {
    mutation: UseMutationResult<
        Category,
        DataError<CategorySchemaOutput>,
        CategorySchemaOutput | UpdateCategoryInput
    >;
    category?: Category;
    isEdit?: boolean;
    /** Valores iniciales al crear (ej. nombre precargado desde la transacción) */
    initialValues?: Partial<CategorySchemaInput>;
    onSuccess?: (category?: Category) => void;
    onClose?: () => void;
}

/* ------------------------------------------------------------------ */
/*  Defaults                                                            */
/* ------------------------------------------------------------------ */
const defaultValues: CategorySchemaInput = {
    type: "EXPENSE",
    name: "",
    color: "#123456",
    icon: "LayoutGrid",
};

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */
export const CategoryForm = ({
    mutation,
    category,
    isEdit,
    initialValues,
    onSuccess,
    onClose,
}: PropsCategoryForm) => {
    const { mutateAsync, isPending, error } = mutation;
    const { deleteCategory } = useCategories();
    const toast = useToast();
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [submitAttempted, setSubmitAttempted] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);

    const {
        control,
        handleSubmit,
        reset,
        setError,
        setValue,
        getValues,
        formState: { isValid },
    } = useForm<CategorySchemaInput, unknown, CategorySchemaOutput>({
        resolver: zodResolver(CategorySchema),
        mode: "onChange",
        defaultValues: { ...defaultValues, ...initialValues },
    });

    const categoryType = useWatch({ control, name: "type" });
    const nameValue = useWatch({ control, name: "name" }) ?? "";
    const isIncome = categoryType === "INCOME";

    const [styleTouched, setStyleTouched] = useState({ color: false, icon: false });

    /* ---------- sugerir color + icono según el nombre (solo al crear) ---------- */
    useEffect(() => {
        if (isEdit || (styleTouched.color && styleTouched.icon)) return;
        const suggestion = suggestCategoryStyle(nameValue);
        if (!suggestion) return;
        if (!styleTouched.color && getValues("color") !== suggestion.color) {
            setValue("color", suggestion.color, { shouldDirty: true, shouldValidate: true });
        }
        if (!styleTouched.icon && getValues("icon") !== suggestion.icon) {
            setValue("icon", suggestion.icon, { shouldDirty: true, shouldValidate: true });
        }
    }, [nameValue, isEdit, styleTouched, getValues, setValue]);

    /* ---------- populate on edit ---------- */
    useEffect(() => {
        if (!isEdit || !category) return;
        reset({
            type: category.type,
            name: category.name,
            color: category.color,
            icon: category.icon ?? "LayoutGrid",
        });
        mutation.reset();
    }, [isEdit, category, reset]);

    /* ---------- errores del backend → campos del formulario ---------- */
    useEffect(() => {
        if (!error?.details) return;
        Object.entries(error.details).forEach(([field, messages]) => {
            const message = Array.isArray(messages) ? messages[0] : undefined;
            if (message && field in defaultValues) {
                setError(field as keyof CategorySchemaInput, { type: "server", message });
            }
        });
    }, [error, setError]);

    /* ---------- submit ---------- */
    const onSubmit = async (data: CategorySchemaOutput) => {
        setSubmitAttempted(false);
        try {
            if (isEdit && category) {
                const updateData: UpdateCategoryInput = { ...data, categoryId: category.id };
                const result = await mutateAsync(updateData);
                toast.success("Categoría actualizada");
                onSuccess?.(result);
                return;
            }

            const result = await mutateAsync(data, {
                onSuccess: () => {
                    reset(defaultValues);
                    setStyleTouched({ color: false, icon: false });
                },
            });

            toast.success("Categoría creada");
            onSuccess?.(result);
        } catch {
            // El error queda en mutation.error y se muestra en la UI (banner o campo)
        }
    };

    const onInvalid = (errors: FieldErrors<CategorySchemaInput>) => {
        setSubmitAttempted(true);
        const firstInvalid = Object.keys(errors)[0];
        if (!firstInvalid) return;

        /* Los inputs custom no exponen refs, así que enfocamos el primero
           marcado con error después de que React pinte la validación. */
        setTimeout(() => {
            const field = formRef.current?.querySelector<HTMLElement>(
                ".custom-form-group.has-error input, .custom-form-group.has-error textarea, .custom-form-group.has-error button"
            );
            field?.focus();
        }, 0);
    };

    /* ---------- derived ---------- */
    const headerIcon = isIncome ? <TrendingUp size={20} /> : <TrendingDown size={20} />;
    const typeModifier = isIncome ? "income" : "expense";
    const knownFields = Object.keys(defaultValues);
    const hasUnmappedDetails = !!error?.details && Object.keys(error.details).some((key) => !knownFields.includes(key));
    const hasMappedDetails = !!error?.details && Object.keys(error.details).length > 0 && !hasUnmappedDetails;
    const validationError = submitAttempted && !isValid
        ? "Faltan datos obligatorios. Revisa los campos marcados."
        : null;
    const serverError = error
        ? hasUnmappedDetails
            ? error.message || "Ocurrió un error inesperado"
            : hasMappedDetails
                ? "No se pudo guardar la categoría. Revisa los campos marcados."
                : error.message || "Ocurrió un error inesperado"
        : null;
    const bannerError = serverError ?? validationError;

    return (
        <>
        <FormContainer
            title={isEdit ? "Editar Categoría" : "Nueva Categoría"}
            icon={headerIcon}
            error={bannerError}
            className="max-w-lg mx-auto"
            onClose={onClose}
        >
            <form
                ref={formRef}
                onSubmit={(event) => {
                    /* El modal puede estar anidado dentro de otro formulario
                       (ej. crear categoría desde una transacción). Sin esto,
                       el submit también valida el formulario de atrás. */
                    event.stopPropagation();
                    handleSubmit(onSubmit, onInvalid)(event);
                }}
                className="form-default-container"
            >

                {/* ── TYPE TOGGLE (solo al crear; PATCH no permite cambiar type) ── */}
                {!isEdit && (
                    <Controller
                        control={control}
                        name="type"
                        render={({ field, fieldState }) => (
                            <TypeToggle<TransactionType>
                                value={field.value}
                                onChange={field.onChange}
                                error={fieldState.error?.message}
                                disabled={isPending}
                                leftOption={{
                                    color: "#ef4444",
                                    value: "EXPENSE",
                                    label: "GASTO",
                                    icon: "TrendingDown",
                                }}
                                rightOption={{
                                    color: "#22c55e",
                                    value: "INCOME",
                                    label: "INGRESO",
                                    icon: "TrendingUp",
                                }}
                            />
                        )}
                    />
                )}

                {/* ── NOMBRE (fijo en categorías base) ─────────────────────── */}
                <Controller
                    control={control}
                    name="name"
                    render={({ field, fieldState }) => (
                        <TextInput
                            label="Nombre de la categoría"
                            placeholder={isIncome ? "Ej. Salario, Freelance…" : "Ej. Alimentación, Transporte…"}
                            icon={"Tag"}
                            value={field.value}
                            onChange={field.onChange}
                            error={fieldState.error?.message}
                            disabled={isPending || (isEdit && category?.isBase)}
                        />
                    )}
                />

                {/* ── COLOR + ICONO ─────────────────────────────────────────── */}
                <div className="form-default-grid-2col">
                    <Controller
                        control={control}
                        name="color"
                        render={({ field, fieldState }) => (
                            <ColorPicker
                                label="Color"
                                value={field.value}
                                onChange={(value) => {
                                    setStyleTouched((t) => ({ ...t, color: true }));
                                    field.onChange(value);
                                }}
                                error={fieldState.error?.message}
                                disabled={isPending}
                            />
                        )}
                    />

                    <Controller
                        control={control}
                        name="icon"
                        render={({ field, fieldState }) => (
                            <IconPicker
                                label="Ícono"
                                icon={"LayoutGrid"}
                                value={field.value}
                                onChange={(value) => {
                                    setStyleTouched((t) => ({ ...t, icon: true }));
                                    field.onChange(value);
                                }}
                                error={fieldState.error?.message}
                                disabled={isPending}
                            />
                        )}
                    />
                </div>

                {/* ── PREVIEW CHIP ─────────────────────────────────────────── */}
                {/* Muestra un chip live con el color e ícono seleccionados */}
                <CategoryPreviewChip
                    control={control}
                    isIncome={isIncome}
                />

                {/* ── ACTIONS ──────────────────────────────────────────────── */}
                <div className="form-default-row form-actions-container">
                    <button
                        type="submit"
                        className={`btn-submit ${typeModifier}`}
                        disabled={isPending}
                    >
                        {isIncome ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        {isPending
                            ? "Guardando…"
                            : isEdit ? "Actualizar" : "Crear categoría"
                        }
                    </button>

                    {isEdit && category && !category.isBase && (
                        <button
                            type="button"
                            className="btn-icon btn-icon-delete"
                            disabled={deleteCategory.isPending}
                            onClick={() => setConfirmDelete(true)}
                        >
                            <Trash2 size={14} />
                            {deleteCategory.isPending ? "Eliminando…" : "Eliminar"}
                        </button>
                    )}
                </div>

            </form>
            </FormContainer>

            <InfoModal
                isOpen={confirmDelete}
                onClose={() => setConfirmDelete(false)}
                onConfirm={() => {
                    if (!category) return;
                    deleteCategory.mutate(category.id, {
                        onSuccess: () => {
                            setConfirmDelete(false);
                            toast.success("Categoría eliminada");
                            onClose?.();
                        },
                    });
                }}
                type="error"
                title="Eliminar categoría"
                message="¿Seguro que deseas eliminar esta categoría? Esta acción no se puede deshacer."
                confirmText={deleteCategory.isPending ? "Eliminando…" : "Eliminar"}
                cancelText="Cancelar"
                confirmDisabled={deleteCategory.isPending}
            />
        </>
    );
};


/* ------------------------------------------------------------------ */
/*  Category Preview Chip (live feedback)                              */
/* ------------------------------------------------------------------ */
import { useWatch as useWatchInner } from "react-hook-form";
import type { Control } from "react-hook-form";
import type { TransactionType } from "../../../transactions/types";
import { getIcon } from "../../../../shared/utils/GetIcon";

interface PreviewProps {
    control: Control<CategorySchemaInput, unknown>;
    isIncome: boolean;
}

function CategoryPreviewChip({ control, isIncome }: PreviewProps) {
    const name = useWatchInner({ control, name: "name" });
    const color = useWatchInner({ control, name: "color" });
    const icon = useWatchInner({ control, name: "icon" });

    if (!name && !color) return null;

    return (
        <div className={`category-preview-chip ${isIncome ? "income" : "expense"}`}>
            <span
                className="chip-dot"
                style={{ background: color || "currentColor" }}
                aria-hidden="true"
            />
            <span className="chip-icon-label">{icon && getIcon(icon) || "—"}</span>
            <span className="chip-name">{name ? name.toUpperCase() : "Sin nombre"}</span>
            <span className={`chip-badge ${isIncome ? "income" : "expense"}`}>
                {isIncome ? "Ingreso" : "Gasto"}
            </span>
        </div>
    );
}
