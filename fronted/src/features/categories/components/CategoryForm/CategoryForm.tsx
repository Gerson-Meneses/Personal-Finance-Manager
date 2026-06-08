import { useEffect } from "react";
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
import { useCategories } from "../../hooks";
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
    onSuccess,
    onClose,
}: PropsCategoryForm) => {
    const { mutateAsync, isPending, error, isSuccess } = mutation;
    const { deleteCategory } = useCategories();

    const {
        control,
        handleSubmit,
        reset,
        formState: { isDirty, isValid },
    } = useForm<CategorySchemaInput, unknown, CategorySchemaOutput>({
        resolver: zodResolver(CategorySchema),
        mode: "onChange",
        defaultValues,
    });

    const categoryType = useWatch({ control, name: "type" });
    const isIncome = categoryType === "INCOME";

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

    /* ---------- submit ---------- */
    const onSubmit = async (data: CategorySchemaOutput) => {
        let result: Category;

        if (isEdit && category) {
            const updateData: UpdateCategoryInput = { ...data, categoryId: category.id };
            result = await mutateAsync(updateData, {
                onSuccess: () => onSuccess?.(result),
            });
            return;
        }

        result = await mutateAsync(data, {
            onSuccess: () => {
                reset(defaultValues);
                onSuccess?.(result);
            },
        });
    };

    /* ---------- derived ---------- */
    const headerIcon = isIncome ? <TrendingUp size={20} /> : <TrendingDown size={20} />;
    const successText = `Categoría ${isEdit ? "actualizada" : "creada"} con éxito.`;
    const typeModifier = isIncome ? "income" : "expense";

    return (
        <FormContainer
            title={isEdit ? "Editar Categoría" : "Nueva Categoría"}
            icon={headerIcon}
            error={error && !error.details ? (error.message || "Ocurrió un error inesperado") : null}
            className="max-w-lg mx-auto"
            onClose={onClose}
        >
            <form onSubmit={handleSubmit(onSubmit)} className="form-default-container">

                {/* ── TYPE TOGGLE ──────────────────────────────────────────── */}
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

                {/* ── NOMBRE ───────────────────────────────────────────────── */}
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
                            disabled={isPending}
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
                                onChange={field.onChange}
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
                                onChange={field.onChange}
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

                    {isEdit && category && (
                        <button
                            type="button"
                            className="btn-icon btn-icon-delete"
                            disabled={deleteCategory.isPending}
                            onClick={() => {
                                if (window.confirm("¿Seguro que deseas eliminar esta categoría?")) {
                                    deleteCategory.mutate(category.id, {
                                        onSuccess: () => onClose?.(),
                                    });
                                }
                            }}
                        >
                            <Trash2 size={14} />
                            {deleteCategory.isPending ? "Eliminando…" : "Eliminar"}
                        </button>
                    )}
                </div>

            </form>
        </FormContainer>
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
            <span className="chip-name">{name || "Sin nombre"}</span>
            <span className={`chip-badge ${isIncome ? "income" : "expense"}`}>
                {isIncome ? "Ingreso" : "Gasto"}
            </span>
        </div>
    );
}