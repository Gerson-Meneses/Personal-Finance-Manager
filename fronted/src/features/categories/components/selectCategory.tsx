import LoadingScreen from "../../../shared/components/LoadingScreen/LoadingScreen"
import { getIcon } from "../../../shared/utils/GetIcon"
import type { TransactionType } from "../../transactions/types"
import { useCategories } from "../hooks"
import type { Category } from "../types"
import './SelectCategory.css'

interface Props {
    value?: string
    onChange: (categoryId: string) => void
    type?: TransactionType
    noLoan?: boolean
    isBase?: boolean
    visible?: boolean
    all?: boolean
    placeholder?: string
    // Nuevas props para igualar a SelectAccount
    label?: string
    icon?: string
    error?: string | null
    disabled?: boolean
    required?: boolean
}

export default function SelectCategory({
    value,
    onChange,
    type,
    noLoan,
    isBase,
    visible,
    all,
    placeholder = "Seleccionar categoría",
    label = "Categoría",
    icon = "LayoutGrid", // Icono por defecto (ajusta según tus iconos disponibles)
    error,
    disabled,
    required
}: Props) {

    const { categories, loading } = useCategories()

    // Usamos el componente LoadingScreen igual que en SelectAccount
    if (loading) return <LoadingScreen />

    // --- Lógica de filtrado original ---
    let filtered = type
        ? categories.filter(c => c.type === type)
        : categories
    
    if (noLoan !== undefined) {
        filtered = filtered.filter(c => c.name !== "PRESTAMOS" && c.name !== "DEVOLUCION DE PRESTAMO")
    }

    if (isBase !== undefined) {
        filtered = filtered.filter(c => c.isBase === isBase)
    }

    if (visible !== undefined) {
        filtered = filtered.filter(c => c.visible === visible)
    }

    if (all !== undefined) {
        filtered = categories
    }
    // -----------------------------------

    return (
        <div className={`custom-form-group ${error ? 'has-error' : ''}`}>
            
            <label className="input-label">
                {getIcon(icon)} {label}
            </label>

            <div className="input-wrapper">
                <select
                    value={value ?? ""}
                    onChange={(e) => onChange(String(e.target.value))}
                    disabled={disabled}
                    required={required}
                >
                    <option value="">
                        {placeholder}
                    </option>

                    {filtered.map((cat: Category) => (
                        <option
                            key={cat.id}
                            value={cat.id}
                        >
                            {cat.name}
                        </option>
                    ))}
                </select>
            </div>

            {error && <span className="error-text">{error}</span>}
        </div>
    )
}