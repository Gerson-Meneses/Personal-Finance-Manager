import { useCategories } from "../../../features/categories/hooks"
import { getIcon } from "../../../shared/utils/GetIcon"
import "./Categories.css"
import { CategoryForm } from "../../../features/categories/components/CategoryForm/CategoryForm"
import LoadingScreen from "../../../shared/components/LoadingScreen/LoadingScreen"
import { useState } from "react"
import { SuccessToast } from "../../../shared/components/SuccesToast/SuccesToast"
import { Plus } from "lucide-react"
import ModalPortal from "../../../shared/components/ModalPortal/ModalPortal"

export default function CategoriesPage() {
    const { categories, loading, createCategory, deleteCategory } = useCategories()
    const [showForm, setShowForm] = useState(false)
    const [toast, setToast] = useState(false)


    const grouped = {
        INCOME: categories.filter(c => c.type === "INCOME"),
        EXPENSE: categories.filter(c => c.type === "EXPENSE"),
        OTHER: categories.filter(c => c.type !== "INCOME" && c.type !== "EXPENSE"),
    }

    if (loading) return <LoadingScreen message="Cargando Categorias..." ></LoadingScreen>
    return (
        <div className="page-container categories-page">
            <header className="page-header card">
                <div>
                    <h1>Categorías</h1>
                    <p className="text-muted">Organiza tus ingresos y gastos</p>
                </div>
                <SuccessToast isSucces={toast} successText="Cuenta creada con exito" >
                    <button className="btn-primary" onClick={() => setShowForm(true)}>
                        <Plus size={20} />
                        Nueva Categoria
                    </button>
                </SuccessToast>
            </header>

            {/* Listas agrupadas */}
            <div className="categories-grid">
                {(["EXPENSE", "INCOME"] as const).map(type => (
                    <div key={type} className="card">
                        <div className="card-head">
                            <h3 className="card-head-title">
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
                <div className="card">
                    <div className="card-head">
                        <h3 className="card-head-title">
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

            <ModalPortal
                isOpen={showForm}
                onClose={() => setShowForm(false)} >

                <CategoryForm
                    mutation={createCategory}
                    onSuccess={() => { setShowForm(false), setToast(true) }}
                />

            </ModalPortal>
        </div>
    )
}