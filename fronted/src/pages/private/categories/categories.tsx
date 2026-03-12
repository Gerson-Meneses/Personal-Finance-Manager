import { useState } from "react"
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

            {categories.data.map(cat => (

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
}