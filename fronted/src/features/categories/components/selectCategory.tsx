import LoadingScreen from "../../../shared/components/LoadingScreen/LoadingScreen"
import { getIcon } from "../../../shared/utils/GetIcon"
import { useCategories } from "../hooks"
import type { Category, TransactionTypeBase } from "../types"
import './SelectCategory.css'
import { useState } from "react"
import ModalPortal from "../../../shared/components/ModalPortal/ModalPortal"
import { CategoryForm } from "./CategoryForm/CategoryForm"


interface Props {
    value?: string
    onChange: (categoryId: string) => void
    type?: TransactionTypeBase
    noLoan?: boolean
    isBase?: boolean
    visible?: boolean
    all?: boolean
    placeholder?: string
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
    icon = "LayoutGrid",
    error,
    disabled,
    required
}: Props) {

    // 1. Extraemos saveCategory (o como se llame en tu hook) para pasarla al form
    const { categories, loading, createCategory } = useCategories()
    const [showForm, setShowForm] = useState(false)

    if (loading) return <LoadingScreen />

    // --- Lógica de filtrado ---
    let filtered = type ? categories.filter(c => c.type === type) : categories

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

    // --- Manejadores ---
    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value
        if (val === "Nueva") {
            setShowForm(true)
        } else {
            onChange(val)
        }
    }

    const handleSuccess = (newCat: Category) => {
        onChange(String(newCat.id)) // Seleccionamos la nueva categoría automáticamente
        setShowForm(false) // Cerramos el modal
    }

    return (
        <div className={`custom-form-group ${error ? 'has-error' : ''}`}>

            <label className="input-label">
                {getIcon(icon)} {label}
            </label>

            <div className="input-wrapper">
                <select
                    value={value ?? ""}
                    onChange={handleSelectChange}
                    disabled={disabled}
                    required={required}
                >
                    <option value="">{placeholder}</option>

                    {/* Opción para disparar el modal */}
                    <option value="Nueva" style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>
                        + Nueva Categoría
                    </option>

                    {filtered.map((cat: Category) => (
                        <option
                            key={cat.id}
                            value={cat.id}
                            style={{
                                backgroundColor: cat.color + '22', // Agregamos transparencia (hex + 22)
                                color: cat.color, // El texto del color de la categoría
                                fontWeight: '500'
                            }}
                        >
                            {cat.name}
                        </option>
                    ))}

                </select>
            </div>

            {error && <span className="error-text">{error}</span>}

            {/* Modal para crear la categoría */}
            <ModalPortal isOpen={showForm} onClose={() => setShowForm(false)}>
                <CategoryForm
                    mutation={createCategory}
                    onSuccess={handleSuccess}
                    initialType={type}
                />
            </ModalPortal>
        </div>
    )
}