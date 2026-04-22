import type { UseMutationResult } from "@tanstack/react-query"
import type { Category, CreateCategoryDTO } from "../../types"
import type { DataError, DetailsError } from "../../../../shared/dataApiInterface"
import { TextInput } from "../../../../shared/components/TextInput/TextInput"
import { useEffect, useState } from "react"
import { handleFieldChange } from "../../../../shared/utils/handleFieldChange"
import { ColorPicker } from "../../../../shared/components/ColorPicker/ColorPicker"
import { IconPicker } from "../../../../shared/components/IconPicker/IconPicker"
import { TypeToggle } from "../../../../shared/components/TypeToggle/TypeToggle"
import { SuccessToast } from "../../../../shared/components/SuccesToast/SuccesToast"
import type { TransactionType } from "../../../transactions/types"

export interface CategoryFormProps {
    mutation: UseMutationResult<Category, DataError<CreateCategoryDTO>, CreateCategoryDTO>
    onSuccess: (category: Category) => void
    category?: Category
    isEdit?: boolean
    title?: string
    initialType?: TransactionType
}

export const CategoryForm = ({
    mutation,
    onSuccess,
    category,
    isEdit,
    title = "Categoría",
}: CategoryFormProps) => {

    const { mutateAsync, isSuccess, error, reset, isPending } = mutation;

    const initialStateForm: CreateCategoryDTO = {
        name: "",
        type: "EXPENSE",
        color: "#000000",
        icon: "LayoutGrid"
    }

    const [formData, setFormData] = useState<CreateCategoryDTO>(initialStateForm);
    const [errors, setErrors] = useState<DetailsError<CreateCategoryDTO> | null>(null);

    // 1. Cargar datos si es edición
    useEffect(() => {
        if (isEdit && category) {
            setFormData({
                name: category.name,
                type: category.type,
                color: category.color,
                icon: category.icon
            });
        }
    }, [isEdit, category]);

    // 2. Manejo de errores de la API
    useEffect(() => {
        if (error?.details) {
            setErrors(error.details as DetailsError<CreateCategoryDTO>);
        }
    }, [error]);

    // 3. Limpieza al montar
    useEffect(() => {
        reset();
        setErrors(null);
    }, []);

    const onChange = <K extends keyof CreateCategoryDTO>(
        field: K,
        value: CreateCategoryDTO[K]
    ) => {
        handleFieldChange(field, value, setFormData, setErrors);
    };

    const getErrorMessage = (field: keyof CreateCategoryDTO) => {
        return errors?.[field] ? errors[field][0] : null;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setErrors(null);

        try {
            // Usamos mutateAsync para obtener la respuesta directamente
            console.log(formData)
            const result = await mutateAsync(formData);

            // Si todo sale bien, ejecutamos el callback con el objeto real
            if (onSuccess) {
                onSuccess(result);
            }
        } catch (err) {
            // El error ya lo maneja el useEffect de 'error' de React Query
            console.error("Error al guardar categoría:", err);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="form-default-container">
            <h2>{isEdit ? `Editar ${title}` : `Crear ${title}`}</h2>

            <div className="form-default-row">
                <TypeToggle
                    value={formData.type}
                    onChange={(val) => onChange("type", val as TransactionType)}
                    error={getErrorMessage("type")}
                />
            </div>

            <div className="form-default-row">
                <TextInput
                    name="name"
                    label="Nombre"
                    icon="Tag"
                    value={formData.name}
                    onChange={(val) => onChange("name", val)}
                    placeholder="Ej: Alimentación"
                    error={getErrorMessage("name")}
                    required
                />
            </div>

            <div className="form-default-row">
                <ColorPicker
                    value={formData.color}
                    onChange={(val) => onChange("color", val)}
                    error={getErrorMessage("color")}
                />
                <IconPicker
                    label="Ícono"
                    icon="Smile"
                    value={formData.icon}
                    onChange={(val) => onChange("icon", val)}
                    error={getErrorMessage("icon")}
                />
            </div>

            {error && !error.details && (
                <div className="error-banner">
                    {error.message || "Error al procesar la categoría"}
                </div>
            )}

            <div className="form-default-row">
                <SuccessToast isSucces={isSuccess} successText={`Categoría ${isEdit ? 'actualizada' : 'creada'} con éxito.`}>
                    <button
                        type="submit"
                        disabled={isPending}
                        className={`btn-submit ${formData.type.toLowerCase()}`}
                    >
                        {isPending ? "Guardando..." : isEdit ? "Actualizar" : "Crear categoría"}
                    </button>
                </SuccessToast>
            </div>
        </form>
    );
};