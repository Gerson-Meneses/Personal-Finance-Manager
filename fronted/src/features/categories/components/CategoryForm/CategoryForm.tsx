import { useEffect, useState } from "react";
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
import { SuccessToast } from "../../../../shared/components/SuccesToast/SuccesToast";
import { FormContainer } from "../../../../shared/components/FormContainer/FormContainer";
import InfoModal from "../../../../shared/components/InfoModal/InfoModal";
import { useCategories } from "../../hooks";
import { suggestCategoryStyle } from "../../styleSuggestion";
import { Controller, useForm, useWatch } from "react-hook-form";
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
    const { mutateAsync, isPending, error, isSuccess } = mutation;
    const { deleteCategory } = useCategories();
    const [confirmDelete, setConfirmDelete] = useState(false);

    const {
        control,
        handleSubmit,
        reset,
        setError,
        setValue,
        getValues,
        formState: { isDirty, isValid },
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
        try {
            if (isEdit && category) {
                const updateData: UpdateCategoryInput = { ...data, categoryId: category.id };
                const result = await mutateAsync(updateData);
                onSuccess?.(result);
                return;
            }

            const result = await mutateAsync(data, {
                onSuccess: () => {
                    reset(defaultValues);
                    setStyleTouched({ color: false, icon: false });
                },
            });

            onSuccess?.(result);
        } catch {
            // El error queda en mutation.error y se muestra en la UI (banner o campo)
        }
    };

    /* ---------- derived ---------- */
    const headerIcon = isIncome ? <TrendingUp size={20} /> : <TrendingDown size={20} />;
    const successText = `Categoría ${isEdit ? "actualizada" : "creada"} con éxito.`;
    const typeModifier = isIncome ? "income" : "expense";
    const knownFields = Object.keys(defaultValues);
    const hasUnmappedDetails = !!error?.details && Object.keys(error.details).some((key) => !knownFields.includes(key));

    return (
        <>
        <FormContainer
            title={isEdit ? "Editar Categoría" : "Nueva Categoría"}
            icon={headerIcon}
            error={error && (!error.details || hasUnmappedDetails) ? (error.message || "Ocurrió un error inesperado") : null}
            className="max-w-lg mx-auto"
            onClose={onClose}
        >
            <form onSubmit={handleSubmit(onSubmit)} className="form-default-container">

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
                    <SuccessToast isSucces={isSuccess} successText={successText}>
                        <button
                            type="submit"
                            className={`btn-submit ${typeModifier}`}
                            disabled={isPending || !isDirty || !isValid}
                        >
                            {isIncome ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                            {isPending
                                ? "Guardando…"
                                : isEdit ? "Actualizar" : "Crear categoría"
                            }
                        </button>
                    </SuccessToast>

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