import { useCategories } from "../hooks"
import type { Category } from "../types"

interface Props {
    value?: string
    onChange: (categoryId: string) => void
    type?: "INCOME" | "EXPENSE",            
    noLoan?: boolean,
    isBase?: boolean,
    visible?: boolean,
    all?: boolean,
    placeholder?: string
}

export default function SelectCategory({
    value,
    onChange,
    type,
    noLoan,
    isBase,
    visible,
    all,
    placeholder = "Seleccionar categoría"
}: Props) {

    const { categories, loading } = useCategories()

    if (loading) {
        return <p>Cargando categorías...</p>
    }

    let filtered = type
        ? categories.data.filter(c => c.type === type)
        : categories.data
    
    if (noLoan !== undefined) {
        filtered = filtered.filter(c => c.name !== "PRESTAMO" && c.name !== "DEVOLUCION DE PRESTAMO")
    }

    if (isBase !== undefined) {
        filtered = filtered.filter(c => c.isBase === isBase)
    }

    if (visible !== undefined) {
        filtered = filtered.filter(c => c.visible === visible)
    }

    if (all!== undefined) {
        filtered = categories.data
    }

    return (

        <select
            value={value ?? ""}
            onChange={(e) => onChange(String(e.target.value))}
        >

            <option value="">
                {placeholder}
            </option>

            {filtered.map((cat: Category) => (

                <option
                    key={cat.id}
                    value={cat.id}
                >
                    {cat.icon ? `${cat.icon} ` : ""}
                    {cat.name}
                </option>

            ))}

        </select>

    )
}