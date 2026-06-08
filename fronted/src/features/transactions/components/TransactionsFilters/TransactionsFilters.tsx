import { useState } from "react";
import { useCategories } from "../../../categories/hooks";
import { useAccounts } from "../../../accounts/hooks";
import { FilterWrapper, type FilterBadgeItem } from "../../../../shared/components/FilterWrapper/FilterWrapper";
import "./TransactionsFilters.css";
import { RangeExactGroup } from "../../../../shared/components/RangeExactGroup/RangeExactGroup";
import { DatePicker } from "../../../../shared/components/DateInput/DateInput";
import { NumericInput } from "../../../../shared/components/NumericInput/NumericInput";
import type { TransactionQuerySchemaOutput } from "../../types";
import { SearchInput } from "../../../../shared/components/SearchInput/SearchInput";

interface Props {
    query: TransactionQuerySchemaOutput;
    onChange: (q: TransactionQuerySchemaOutput) => void;
    onReset: () => void;
    search: string;
    onSearchChange: (value: string) => void;
}

type DateMode = "range" | "exact";
type AmountMode = "range" | "exact";

export default function TransactionFilters({ query, onChange, onReset, search, onSearchChange }: Props) {
    const { categories } = useCategories();
    const { accounts } = useAccounts();
    const [open, setOpen] = useState(false);

    // Inicialización del estado local de los toggles basado en lo que venga de la URL
    const [dateMode, setDateMode] = useState<DateMode>(query.date ? "exact" : "range");
    const [amountMode, setAmountMode] = useState<AmountMode>(query.amount ? "exact" : "range");

    // Función helper para actualizar campos del esquema de forma inmutable
    const set = <K extends keyof TransactionQuerySchemaOutput>(
        key: K,
        value: TransactionQuerySchemaOutput[K]
    ) => {
        onChange({ ...query, [key]: value || undefined });
    };

    // Calculamos los filtros activos dinámicamente ignorando los de control técnico (page, limit, order)
    const activeCount = Object.entries(query).filter(([key, value]) => {
        if (key === "page" || key === "limit" || key === "order") return false;
        return value !== undefined && value !== "";
    }).length;

    let activeFilter: FilterBadgeItem[] = []

    for (let key in query) {
        if (key === "page" || key === "limit" || key === "order") continue;

        const queryKey = key as keyof typeof query;

        activeFilter.push({
            key: key,
            label: String(query[queryKey])
        });
    }

    const removeFilter = (key: keyof typeof query) => {
        const { [key]: _, ...rest } = query
        onChange(rest)
    }

    return (
        <FilterWrapper
            isOpen={open}
            onToggleOpen={() => setOpen((p) => !p)}
            activeCount={activeCount}
            activeFilters={activeFilter}
            onReset={onReset}
            onRemoveFilter={removeFilter}

            searchElement={
                <SearchInput
                    value={search}
                    onChange={onSearchChange}
                    placeholder="Buscar por nombre, categoría, fecha..."
                />
            }
            orderElement={
                <select
                    className="tf-select-small"
                    value={query.order ?? "DESC"}
                    onChange={(e) => set("order", e.target.value as "ASC" | "DESC")}
                >
                    <option value="DESC">Más recientes</option>
                    <option value="ASC">Más antiguos</option>
                </select>
            }
        >
            {/* 🎯 PANEL DESPLEGABLE DE FILTROS AVANZADOS */}
            <div className="space-y-4">

                {/* ================= TIPO ================= */}
                <div className="tf-group">
                    <span className="tf-group-label">Tipo</span>
                    <div className="tf-chips">
                        {[
                            { value: undefined, label: "Todos" },
                            { value: "INCOME", label: "Ingresos" },
                            { value: "EXPENSE", label: "Gastos" },
                            { value: "TRANSFER", label: "Transferencias" },
                            { value: "CREDIT_PAYMENT", label: "Pago tarjeta" },
                        ].map((opt) => (
                            <button
                                key={opt.label}
                                type="button"
                                className={`tf-chip ${query.type === opt.value ? "active" : ""}`}
                                onClick={() => set("type", opt.value as any)}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="tf-divider" />

                {/* ================= FECHA Y MONTO (LAYOUT EN PARALELO) ================= */}
                <div className="grid-auto-tall">
                    <RangeExactGroup
                        label="Fecha"
                        icon="calendar"
                        mode={dateMode}
                        onModeChange={(mode) => {
                            setDateMode(mode);
                            onChange(mode === "exact"
                                ? { ...query, from: undefined, to: undefined }
                                : { ...query, date: undefined }
                            );
                        }}
                        exactInput={
                            <DatePicker
                                icon=""
                                label="Fecha exacta"
                                value={query.date}
                                onChange={(val) => onChange({ ...query, date: val })}
                            />
                        }
                        rangeInputs={
                            <div className="flex gap-4 w-full">
                                <div className="flex-1">
                                    <DatePicker
                                        icon=""
                                        label="Desde"
                                        value={query.from}
                                        onChange={(val) => onChange({ ...query, from: val })}
                                    />
                                </div>
                                <div className="flex-1">
                                    <DatePicker
                                        icon=""
                                        label="Hasta"
                                        value={query.to}
                                        onChange={(val) => onChange({ ...query, to: val })}
                                    />
                                </div>
                            </div>
                        }
                    />

                    <RangeExactGroup
                        label="Monto"
                        icon="DollarSign"
                        mode={amountMode}
                        onModeChange={(mode) => {
                            amountMode !== mode && setAmountMode(mode);
                            onChange(mode === "exact"
                                ? { ...query, minAmount: undefined, maxAmount: undefined }
                                : { ...query, amount: undefined }
                            );
                        }}
                        exactInput={
                            <NumericInput
                                label="Monto exacto"
                                value={query.amount?.toString() ?? ""}
                                onChange={(val) => onChange({ ...query, amount: val ? Number(val) : undefined })}
                                symbol="S/"
                                icon={""}
                                autoResize={false}
                            />
                        }
                        rangeInputs={
                            <div className="flex gap-4 w-full">
                                <div className="flex-1">
                                    <NumericInput
                                        icon={""}
                                        label="Mínimo"
                                        value={query.minAmount?.toString() ?? ""}
                                        onChange={(val) => onChange({ ...query, minAmount: val ? Number(val) : undefined })}
                                        symbol="S/"
                                        autoResize={false}
                                    />
                                </div>
                                <div className="flex-1">
                                    <NumericInput
                                        icon={""}
                                        label="Máximo"
                                        value={query.maxAmount?.toString() ?? ""}
                                        onChange={(val) => onChange({ ...query, maxAmount: val ? Number(val) : undefined })}
                                        symbol="S/"
                                        autoResize={false}
                                    />
                                </div>
                            </div>
                        }
                    />
                </div>

                <div className="tf-divider" />

                {/* ================= CATEGORÍA Y CUENTA ================= */}
                <div className="tf-row">
                    <div className="tf-group" style={{ flex: 1 }}>
                        <span className="tf-group-label">Categoría</span>
                        <select
                            className="tf-select"
                            value={query.categoryId ?? ""}
                            onChange={(e) => set("categoryId", e.target.value)}
                        >
                            <option value="">Todas</option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="tf-group" style={{ flex: 1 }}>
                        <span className="tf-group-label">Cuenta</span>
                        <select
                            className="tf-select"
                            value={query.accountId ?? ""}
                            onChange={(e) => set("accountId", e.target.value)}
                        >
                            <option value="">Todas</option>
                            {accounts.map((acc) => (
                                <option key={acc.id} value={acc.id}>
                                    {acc.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="tf-divider" />

                {/* ================= PAGINACIÓN ================= */}
                <div className="tf-row tf-row-end">
                    <div className="tf-group">
                        <span className="tf-group-label">Resultados por página</span>
                        <div className="tf-chips">
                            {[20, 50, 100].map((n) => (
                                <button
                                    key={n}
                                    type="button"
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
        </FilterWrapper>
    );
}