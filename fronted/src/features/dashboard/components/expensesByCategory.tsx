import { formatCurrency } from "../../../shared/utils/formatCurrency"
import { getIcon } from "../../../shared/utils/GetIcon"
import { useNavigate } from "react-router-dom"
import type { CategoryExpense } from "../types"

interface Props {
    expenses: CategoryExpense[]
    totalExpense: number
}

export default function ExpensesByCategory({ expenses, totalExpense }: Props) {
    const navigate = useNavigate()

    const sorted = [...expenses]
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 6)

    return (
        <div className="dashboard-card expenses-by-cat">
            <div className="dashboard-card-header">
                <h3 className="dashboard-card-title">Gastos por categoría</h3>
                <button
                    className="dashboard-card-action"
                    onClick={() => navigate("/categories")}
                >
                    Gestionar →
                </button>
            </div>

            {sorted.length === 0 ? (
                <div className="cat-empty">
                    <span className="text-muted" style={{ fontSize: "0.82rem" }}>
                        Sin gastos registrados este mes
                    </span>
                </div>
            ) : (
                <div className="cat-list">
                    {sorted.map(({ category, amount, total }) => {
                        const pct = totalExpense > 0
                            ? Math.round((amount / totalExpense) * 100)
                            : 0

                        return (
                            <div key={category.id} className="cat-row">
                                <div className="cat-row-left">
                                    <div
                                        className="cat-icon"
                                        style={{
                                            background: category.color + "20",
                                            color: category.color
                                        }}
                                    >
                                        {getIcon(category.icon) ?? getIcon("Tag")}
                                    </div>
                                    <div className="cat-info">
                                        <span className="cat-name">{category.name}</span>
                                        <span className="cat-txcount">
                                            {total} transacción{total !== 1 ? "es" : ""}
                                        </span>
                                    </div>
                                </div>

                                <div className="cat-row-right">
                                    <span className="cat-amount text-danger">
                                        {formatCurrency(amount)}
                                    </span>
                                    <span className="cat-pct">{pct}%</span>
                                </div>

                                <div className="cat-bar-track">
                                    <div
                                        className="cat-bar-fill"
                                        style={{
                                            width: `${pct}%`,
                                            background: category.color
                                        }}
                                    />
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}