import { useState } from "react"
import { useCategories } from "../../../features/categories/hooks"
import { TextInput } from "../../../shared/components/TextInput/TextInput"
import { handleFieldChange } from "../../../shared/utils/handleFieldChange"
import { getIcon } from "../../../shared/utils/GetIcon"
import "./Categories.css"

interface CategoryForm {
    name: string
    color: string
    icon: string
    type: "INCOME" | "EXPENSE"
}

const initialForm: CategoryForm = {
    name: "",
    color: "#22c55e",
    icon: "",
    type: "EXPENSE"
}

export default function CategoriesPage() {
    const { categories, loading, createCategory, deleteCategory } = useCategories()
    const [formData, setFormData] = useState<CategoryForm>(initialForm)

    const onChange = <K extends keyof CategoryForm>(field: K, value: CategoryForm[K]) => {
        handleFieldChange(field, value, setFormData, () => { })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.name.trim()) return
        await createCategory(formData)
        setFormData(initialForm)
    }

    const grouped = {
        INCOME: categories.filter(c => c.type === "INCOME"),
        EXPENSE: categories.filter(c => c.type === "EXPENSE"),
        OTHER: categories.filter(c => c.type !== "INCOME" && c.type !== "EXPENSE"),
    }

    if (loading) return <div className="page-container"><p className="text-muted">Cargando...</p></div>

    return (
        <div className="page-container categories-page">

            <header className="page-header">
                <div>
                    <h1>Categorías</h1>
                    <p className="text-muted">Organiza tus ingresos y gastos</p>
                </div>
            </header>

            {/* Form */}
            <div className="dashboard-card category-form-card">
                <div className="dashboard-card-header">
                    <h3 className="dashboard-card-title">Nueva categoría</h3>
                </div>

                <form onSubmit={handleSubmit} className="category-form">
                    <div className="category-form-row">
                        <TextInput
                            name="name"
                            label="Nombre"
                            icon="Tag"
                            value={formData.name}
                            onChange={(val) => onChange("name", val)}
                            placeholder="Ej: Alimentación"
                            required
                        />
                        <TextInput
                            name="icon"
                            label="Ícono"
                            icon="Smile"
                            value={formData.icon}
                            onChange={(val) => onChange("icon", val)}
                            placeholder="Ej: ShoppingCart"
                        />
                        <div className="custom-form-group">
                            <label className="input-label">
                                {getIcon("Palette")} Color
                            </label>
                            <div className="color-input-wrapper">
                                <input
                                    type="color"
                                    value={formData.color}
                                    onChange={(e) => onChange("color", e.target.value)}
                                    className="color-picker"
                                />
                                <span className="color-hex">{formData.color}</span>
                            </div>
                        </div>

                        <div className="custom-form-group">
                            <label className="input-label">
                                {getIcon("ArrowLeftRight")} Tipo
                            </label>
                            <div className="type-toggle-simple">
                                <button
                                    type="button"
                                    className={`type-btn expense ${formData.type === "EXPENSE" ? "active" : ""}`}
                                    onClick={() => onChange("type", "EXPENSE")}
                                >
                                    Gasto
                                </button>
                                <button
                                    type="button"
                                    className={`type-btn income ${formData.type === "INCOME" ? "active" : ""}`}
                                    onClick={() => onChange("type", "INCOME")}
                                >
                                    Ingreso
                                </button>
                            </div>
                        </div>
                    </div>

                    <button type="submit" className={`form-default-button ${formData.type.toLowerCase()}`}>
                        Crear categoría
                    </button>
                </form>
            </div>

            {/* Listas agrupadas */}
            <div className="categories-grid">
                {(["EXPENSE", "INCOME"] as const).map(type => (
                    <div key={type} className="dashboard-card">
                        <div className="dashboard-card-header">
                            <h3 className="dashboard-card-title">
                                {type === "INCOME" ? "Ingresos" : "Gastos"}
                                <span className="cat-count">{grouped[type].length}</span>
                            </h3>
                        </div>
                        <div className="category-list">
                            {grouped[type].length === 0 ? (
                                <p className="text-muted" style={{ fontSize: "0.82rem", textAlign: "center", padding: "16px 0" }}>
                                    Sin categorías
                                </p>
                            ) : grouped[type].map(cat => (
                                <div key={cat.id} className="category-item">
                                    <div className="category-item-left">
                                        <div
                                            className="category-dot"
                                            style={{ background: cat.color }}
                                        />
                                        <div
                                            className="category-icon-wrap"
                                            style={{ background: cat.color + "20", color: cat.color }}
                                        >
                                            {cat.icon ? getIcon(cat.icon) : getIcon("Tag")}
                                        </div>
                                        <span className="category-name">{cat.name}</span>
                                    </div>
                                    <button
                                        className="category-delete-btn"
                                        onClick={() => {
                                            if (window.confirm(`¿Eliminar "${cat.name}"?`)) {
                                                deleteCategory(cat.id)
                                            }
                                        }}
                                        aria-label={`Eliminar ${cat.name}`}
                                    >
                                        {getIcon("trash2")}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Otros tipos (TRANSFER, CREDIT_PAYMENT, etc.) */}
            {grouped.OTHER.length > 0 && (
                <div className="dashboard-card">
                    <div className="dashboard-card-header">
                        <h3 className="dashboard-card-title">
                            Otros
                            <span className="cat-count">{grouped.OTHER.length}</span>
                        </h3>
                    </div>
                    <div className="category-list">
                        {grouped.OTHER.map(cat => (
                            <div key={cat.id} className="category-item">
                                <div className="category-item-left">
                                    <div className="category-dot" style={{ background: cat.color }} />
                                    <div
                                        className="category-icon-wrap"
                                        style={{ background: cat.color + "20", color: cat.color }}
                                    >
                                        {cat.icon ? getIcon(cat.icon) : getIcon("Tag")}
                                    </div>
                                    <span className="category-name">{cat.name}</span>
                                    <span className="cat-type-badge">{cat.type}</span>
                                </div>
                                <button
                                    className="category-delete-btn"
                                    onClick={() => {
                                        if (window.confirm(`¿Eliminar "${cat.name}"?`)) {
                                            deleteCategory(cat.id)
                                        }
                                    }}
                                >
                                    {getIcon("trash2")}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}






































/* ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// */

/* import { useState } from "react"
import { useCategories } from "../../../features/categories/hooks"

export default function CategoriesPage() {

    const {
        categories,
        loading,
        createCategory,
        deleteCategory
    } = useCategories()

    const [name, setName] = useState("")
    const [type, setType] = useState<"INCOME" | "EXPENSE">("EXPENSE")
    const [color, setColor] = useState("")
    const [icon, setIcon] = useState("")
   

    const handleSubmit = async (e: React.FormEvent) => {

        e.preventDefault()

        if (!name.trim()) return

        await createCategory({
            name,
            type,
            color,
            icon
        })

        setName("")
    }

    if (loading) return <p>Cargando...</p>

    return (

        <div>

            <h2>Categorías</h2>

            <form onSubmit={handleSubmit}>

                <input
                    type="text"
                    value={name}
                    placeholder="Nombre"
                    onChange={(e) => setName(e.target.value)}
                />

                <select
                    value={type}
                    onChange={(e) =>
                        setType(e.target.value as any)
                    }
                >
                    <option value="EXPENSE">Gasto</option>
                    <option value="INCOME">Ingreso</option>
                </select>

                <input type="text"
                    value={color}
                    placeholder="Color"
                    onChange={(e) => setColor(e.target.value)}
                />

                <input type="text"
                    value={icon}
                    placeholder="Ícono"
                    onChange={(e) => setIcon(e.target.value)}
                />

                <button>
                    Crear
                </button>

            </form>

            <hr />

            {categories.map(cat => (

                <div style={{ "borderLeft": `5px solid ${cat.color}`, "margin": "15px 0" }} key={cat.id}>

                    <span>{cat.name} - </span>

                    <span>{cat.type}</span>

                    <button
                        className="cursorPointer"
                        onClick={async () => {
                            if (window.confirm("¿Estás seguro de eliminar esta categoría?")) {
                                try {
                                    await deleteCategory(cat.id)
                                } catch (error) {
                                    console.log(error)
                                }
                            }
                        }
                        }
                    >
                        Eliminar
                    </button>

                </div>

            ))}

        </div>
    )
} */