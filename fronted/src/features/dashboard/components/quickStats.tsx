import { formatCurrency } from "../../../shared/utils/formatCurrency"
import { useNavigate } from "react-router-dom"
import type { CategoryExpense } from "../types"

interface Props {
    income: number
    expense: number
    net: number
    topCategory?: CategoryExpense
    totalAmtDue: number  // lo que te deben
    totalDebt: number    // lo que debes
}

export default function QuickStats({
    income, expense, net, topCategory, totalAmtDue, totalDebt
}: Props) {
    const navigate = useNavigate()
    const savingsRate = income > 0 ? Math.round((net / income) * 100) : 0
    const isPositive = net >= 0

    const stats = [
        {
            label: "Ingresos",
            value: formatCurrency(income),
            valueClass: "text-success",
            sub: "este mes"
        },
        {
            label: "Gastos",
            value: formatCurrency(expense),
            valueClass: "text-danger",
            sub: "este mes"
        },
        {
            label: "Balance",
            value: formatCurrency(net),
            valueClass: isPositive ? "text-success" : "text-danger",
            sub: isPositive ? "superávit" : "déficit"
        },
        {
            label: "Tasa de ahorro",
            value: income > 0 ? `${savingsRate}%` : "—",
            valueClass: savingsRate >= 20
                ? "text-success"
                : savingsRate >= 0
                    ? "text-warning"
                    : "text-danger",
            sub: income === 0
                ? "sin ingresos"
                : savingsRate >= 20
                    ? "excelente"
                    : savingsRate >= 0
                        ? "mejorable"
                        : "en rojo"
        },
    ]

    return (
        <div className="card">
            <div className="qs-grid">
                {stats.map((s, i) => (
                    <div key={i} className="qs-item">
                        <span className="qs-label">{s.label}</span>
                        <span className={`qs-value amount-font ${s.valueClass}`}>
                            {s.value}
                        </span>
                        <span className="qs-sub">{s.sub}</span>
                    </div>
                ))}
            </div>

            {/* Tags informativos */}
            {(topCategory || totalDebt > 0 || totalAmtDue > 0) && (
                <div className="qs-bottom">
                    {topCategory && (
                        <div
                            className="qs-tag"
                            onClick={() => navigate("/categories")}
                        >
                            <div
                                className="qs-tag-dot"
                                style={{ background: topCategory.category.color }}
                            />
                            <span>
                                Mayor gasto:{" "}
                                <strong>{topCategory.category.name}</strong>
                            </span>
                            <span className="text-danger">
                                {formatCurrency(topCategory.amount)}
                            </span>
                        </div>
                    )}

                    {totalDebt > 0 && (
                        <div
                            className="qs-tag qs-tag-warning"
                            onClick={() => navigate("/loans")}
                        >
                            <span>Yo debo</span>
                            <span className="text-danger">
                                {formatCurrency(totalDebt)}
                            </span>
                        </div>
                    )}

                    {totalAmtDue > 0 && (
                        <div
                            className="qs-tag qs-tag-success"
                            onClick={() => navigate("/loans")}
                        >
                            <span>Me deben</span>
                            <span className="text-success">
                                {formatCurrency(totalAmtDue)}
                            </span>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}