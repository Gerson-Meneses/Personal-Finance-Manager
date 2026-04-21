import { useState } from "react"
import { getIcon } from "../../../../shared/utils/GetIcon"
import { useCategories } from "../../../categories/hooks"
import { useAccounts } from "../../../accounts/hooks"
import type { TransactionQuerySchema } from "../../types"
import "./TransactionsFilters.css"

interface Props {
    query: TransactionQuerySchema
    onChange: (q: TransactionQuerySchema
    ) => void
    onReset: () => void
}

type DateMode = "range" | "exact"
type AmountMode = "range" | "exact"

export default function TransactionFilters({ query, onChange, onReset }: Props) {
    const { categories } = useCategories()
    const { accounts } = useAccounts()
    const [open, setOpen] = useState(false)
    const [dateMode, setDateMode] = useState<DateMode>("range")
    const [amountMode, setAmountMode] = useState<AmountMode>("range")

    const set = <K extends keyof TransactionQuerySchema>(key: K, value: TransactionQuerySchema[K]) => {
        onChange({ ...query, [key]: value || undefined })
    }

    const activeCount = Object.values(query).filter(v => v !== undefined && v !== "").length

    return (
        <div className="card tf-wrap">
            {/* Barra superior — búsqueda semántica + toggle filtros */}
            <div className=" tf-top-bar">
                <div className="tf-search-wrap">
                    <span className="tf-search-icon">{getIcon("Search")}</span>
                    <input
                        className="tf-search-input"
                        type="text"
                        placeholder="Buscar por nombre, categoría, cuenta..."
                        // La búsqueda semántica iría aquí cuando implementes embeddings
                        // Por ahora filtra localmente desde el componente padre
                    />
                </div>

                <div className="tf-controls">
                    {/* Orden */}
                    <select
                        className="tf-select-small"
                        value={query.order ?? "DESC"}
                        onChange={e => set("order", e.target.value as "ASC" | "DESC")}
                    >
                        <option value="DESC">Más recientes</option>
                        <option value="ASC">Más antiguos</option>
                    </select>

                    {/* Toggle filtros */}
                    <button
                        className={`tf-filter-toggle ${open ? "active" : ""}`}
                        onClick={() => setOpen(p => !p)}
                    >
                        {getIcon("SlidersHorizontal")}
                        Filtros
                        {activeCount > 0 && (
                            <span className="tf-active-count">{activeCount}</span>
                        )}
                    </button>

                    {activeCount > 0 && (
                        <button className="tf-reset-btn" onClick={onReset}>
                            {getIcon("X")} Limpiar
                        </button>
                    )}
                </div>
            </div>

            {/* Panel de filtros expandible */}
            {open && (
                <div className="tf-panel animate-slide-in">

                    {/* Tipo */}
                    <div className="tf-group">
                        <span className="tf-group-label">Tipo</span>
                        <div className="tf-chips">
                            {[
                                { value: undefined,          label: "Todos" },
                                { value: "INCOME",           label: "Ingresos" },
                                { value: "EXPENSE",          label: "Gastos" },
                                { value: "TRANSFER",         label: "Transferencias" },
                                { value: "CREDIT_PAYMENT",   label: "Pago tarjeta" },
                            ].map(opt => (
                                <button
                                    key={opt.label}
                                    className={`tf-chip ${query.type === opt.value ? "active" : ""}`}
                                    onClick={() => set("type", opt.value as any)}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="tf-divider" />

                    {/* Fecha */}
                    <div className="tf-group">
                        <div className="tf-group-header">
                            <span className="tf-group-label">Fecha</span>
                            <div className="tf-mode-toggle">
                                <button
                                    className={dateMode === "range" ? "active" : ""}
                                    onClick={() => { setDateMode("range"); set("date", undefined) }}
                                >
                                    Rango
                                </button>
                                <button
                                    className={dateMode === "exact" ? "active" : ""}
                                    onClick={() => { setDateMode("exact"); set("from", undefined); set("to", undefined) }}
                                >
                                    Exacta
                                </button>
                            </div>
                        </div>

                        {dateMode === "range" ? (
                            <div className="tf-row">
                                <div className="tf-field">
                                    <label>Desde</label>
                                    <input
                                        type="date"
                                        value={query.from ?? ""}
                                        onChange={e => set("from", e.target.value)}
                                    />
                                </div>
                                <div className="tf-field">
                                    <label>Hasta</label>
                                    <input
                                        type="date"
                                        value={query.to ?? ""}
                                        onChange={e => set("to", e.target.value)}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="tf-field">
                                <label>Fecha exacta</label>
                                <input
                                    type="date"
                                    value={query.date ?? ""}
                                    onChange={e => set("date", e.target.value)}
                                />
                            </div>
                        )}
                    </div>

                    <div className="tf-divider" />

                    {/* Monto */}
                    <div className="tf-group">
                        <div className="tf-group-header">
                            <span className="tf-group-label">Monto</span>
                            <div className="tf-mode-toggle">
                                <button
                                    className={amountMode === "range" ? "active" : ""}
                                    onClick={() => { setAmountMode("range"); set("amount", undefined) }}
                                >
                                    Rango
                                </button>
                                <button
                                    className={amountMode === "exact" ? "active" : ""}
                                    onClick={() => { setAmountMode("exact"); set("minAmount", undefined); set("maxAmount", undefined) }}
                                >
                                    Exacto
                                </button>
                            </div>
                        </div>

                        {amountMode === "range" ? (
                            <div className="tf-row">
                                <div className="tf-field">
                                    <label>Mínimo (S/)</label>
                                    <input
                                        type="number"
                                        min={0}
                                        placeholder="0.00"
                                        value={query.minAmount ?? ""}
                                        onChange={e => set("minAmount", e.target.value ? Number(e.target.value) : undefined)}
                                    />
                                </div>
                                <div className="tf-field">
                                    <label>Máximo (S/)</label>
                                    <input
                                        type="number"
                                        min={0}
                                        placeholder="Sin límite"
                                        value={query.maxAmount ?? ""}
                                        onChange={e => set("maxAmount", e.target.value ? Number(e.target.value) : undefined)}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="tf-field">
                                <label>Monto exacto (S/)</label>
                                <input
                                    type="number"
                                    min={0}
                                    placeholder="0.00"
                                    value={query.amount ?? ""}
                                    onChange={e => set("amount", e.target.value ? Number(e.target.value) : undefined)}
                                />
                            </div>
                        )}
                    </div>

                    <div className="tf-divider" />

                    {/* Categoría y cuenta */}
                    <div className="tf-row">
                        <div className="tf-group" style={{ flex: 1 }}>
                            <span className="tf-group-label">Categoría</span>
                            <select
                                className="tf-select"
                                value={query.categoryId ?? ""}
                                onChange={e => set("categoryId", e.target.value)}
                            >
                                <option value="">Todas</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="tf-group" style={{ flex: 1 }}>
                            <span className="tf-group-label">Cuenta</span>
                            <select
                                className="tf-select"
                                value={query.accountId ?? ""}
                                onChange={e => set("accountId", e.target.value)}
                            >
                                <option value="">Todas</option>
                                {accounts.map(acc => (
                                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="tf-divider" />

                    {/* Paginación */}
                    <div className="tf-row tf-row-end">
                        <div className="tf-group">
                            <span className="tf-group-label">Resultados por página</span>
                            <div className="tf-chips">
                                {[20, 50, 100].map(n => (
                                    <button
                                        key={n}
                                        className={`tf-chip ${(query.limit ?? 20) === n ? "active" : ""}`}
                                        onClick={() => set("limit", n)}
                                    >
                                        {n}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}