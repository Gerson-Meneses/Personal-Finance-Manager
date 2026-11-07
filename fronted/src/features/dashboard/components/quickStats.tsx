import { formatCurrency } from "../../../shared/utils/formatCurrency"
import { useNavigate } from "react-router-dom"
import dayjs from "dayjs"
import "dayjs/locale/es"
import type { CategoryExpense } from "../types"

dayjs.locale("es")

interface Props {
    income: number
    expense: number
    net: number
    topCategory?: CategoryExpense
    totalAmtDue: number  // lo que te deben
    totalDebt: number    // lo que debes
}

interface Stat {
    label: string
    value: string
    valueClass: string
    sub: string
    to?: string
}

export default function QuickStats({
    income, expense, net, topCategory, totalAmtDue, totalDebt
}: Props) {
    const navigate = useNavigate()
    const savingsRate = income > 0 ? Math.round((net / income) * 100) : 0
    const isPositive = net >= 0

    // Flujo del mes: qué % de los ingresos se fue en gastos y qué % quedó
    const expensePct = income > 0 ? Math.min(Math.round((expense / income) * 100), 100) : 0
    const netPct = income > 0 ? 100 - expensePct : 0
    const overspent = income > 0 && expense > income

    const stats: Stat[] = [
        {
            label: "Ingresos",
            value: formatCurrency(income),
            valueClass: "text-success",
            sub: "este mes",
            to: "/transactions?type=INCOME",
        },
        {
            label: "Gastos",
            value: formatCurrency(expense),
            valueClass: "text-danger",
            sub: "este mes",
            to: "/transactions?type=EXPENSE",
        },
        {
            label: "Balance",
            value: formatCurrency(net),
            valueClass: isPositive ? "text-success" : "text-danger",
            sub: isPositive ? "superávit" : "déficit",
            to: "/transactions",
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
                        : "en rojo",
        },
    ]

    return (
        <div className="card">
            <div className="card-head">
                <h3 className="card-head-title">Resumen de {dayjs().format("MMMM")}</h3>
            </div>

            <div className="qs-grid">
                {stats.map((s) => {
                    const content = (
                        <>
                            <span className="qs-label">{s.label}</span>
                            <span className={`qs-value amount-font ${s.valueClass}`}>
                                {s.value}
                            </span>
                            <span className="qs-sub">{s.sub}</span>
                        </>
                    )

                    return s.to ? (
                        <button
                            key={s.label}
                            type="button"
                            className="qs-item"
                            aria-label={`Ver ${s.label.toLowerCase()} en transacciones`}
                            onClick={() => navigate(s.to!)}
                        >
                            {content}
                        </button>
                    ) : (
                        <div key={s.label} className="qs-item">
                            {content}
                        </div>
                    )
                })}
            </div>

            {/* Flujo del mes: gastos vs ahorro sobre los ingresos */}
            {income > 0 && (
                <div className="qs-flow">
                    <div className="qs-flow-track">
                        <div
                            className="qs-flow-fill qs-flow-expense"
                            style={{ width: `${expensePct}%` }}
                        />
                        <div
                            className="qs-flow-fill qs-flow-net"
                            style={{ width: `${netPct}%` }}
                        />
                    </div>
                    <div className="qs-flow-labels">
                        <span className="text-danger">
                            {overspent
                                ? `Gastaste ${formatCurrency(expense - income)} más de lo que ingresó`
                                : `${expensePct}% en gastos`}
                        </span>
                        {!overspent && (
                            <span className="text-success">{netPct}% ahorrado</span>
                        )}
                    </div>
                </div>
            )}

            {/* Tags informativos */}
            {(topCategory || totalDebt > 0 || totalAmtDue > 0) && (
                <div className="qs-bottom">
                    {topCategory && (
                        <button
                            type="button"
                            className="qs-tag"
                            aria-label={`Ver gastos de ${topCategory.category.name}`}
                            onClick={() =>
                                navigate(`/transactions?categoryId=${topCategory.category.id}`)
                            }
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
                        </button>
                    )}

                    {totalDebt > 0 && (
                        <button
                            type="button"
                            className="qs-tag qs-tag-warning"
                            aria-label="Ver préstamos: yo debo"
                            onClick={() => navigate("/loans")}
                        >
                            <span>Yo debo</span>
                            <span className="text-danger">
                                {formatCurrency(totalDebt)}
                            </span>
                        </button>
                    )}

                    {totalAmtDue > 0 && (
                        <button
                            type="button"
                            className="qs-tag qs-tag-success"
                            aria-label="Ver préstamos: me deben"
                            onClick={() => navigate("/loans")}
                        >
                            <span>Me deben</span>
                            <span className="text-success">
                                {formatCurrency(totalAmtDue)}
                            </span>
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}
