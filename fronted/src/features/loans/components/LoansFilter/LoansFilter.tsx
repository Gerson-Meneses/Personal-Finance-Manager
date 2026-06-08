import { useState } from "react";
import type { LoanQueryFilters } from "../../types";
import { FilterWrapper, type FilterBadgeItem } from "../../../../shared/components/FilterWrapper/FilterWrapper";
import { SelectInput } from "../../../../shared/components/SelectInput/SelectInput";
import { DatePicker } from "../../../../shared/components/DateInput/DateInput";
import { NumericInput } from "../../../../shared/components/NumericInput/NumericInput";
import { SearchInput } from "../../../../shared/components/SearchInput/SearchInput";


interface LoanFiterProps {
    query: LoanQueryFilters;
    onChange: (q: LoanQueryFilters) => void;
    onReset: () => void;
    search: string;
    onSearchChange: (value: string) => void;
}

export const LoansFilter = ({ query, onChange, onReset, search, onSearchChange }: LoanFiterProps) => {
    const [open, setOpen] = useState(false);

    const set = <K extends keyof LoanQueryFilters>(
        key: K,
        value: LoanQueryFilters[K]
    ) => {
        onChange({ ...query, [key]: value || undefined });
    };

    const activeCount = Object.entries(query).filter(([key, value]) => {
        if (key === "page" || key === "limit" || key === "order" || key === "orderBy") return false;
        return value !== undefined && value !== "";
    }).length;

    let activeFilter: FilterBadgeItem[] = []

    for (let key in query) {
        if (key === "page" || key === "limit" || key === "order" || key === "orderBy") continue;

        const queryKey = key as keyof typeof query;
        const value = query[queryKey];

        if (value !== undefined && value !== "") {
            activeFilter.push({
                key: key,
                label: String(value)
            });
        }
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
                    <span className="tf-group-label">Tipo de préstamo</span>
                    <div className="tf-chips">
                        {[
                            { value: undefined, label: "Todos" },
                            { value: "RECEIVED", label: "Recibí" },
                            { value: "GIVEN", label: "Otorgué" },
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

                {/* ================= ESTADO ================= */}
                <div className="tf-group">
                    <SelectInput
                        label="Estado del préstamo"
                        value={query.status ?? "Todos"}
                        onChange={(value) => set("status", value as "PAID" | "PENDING")}
                        options={[
                            { value: "PAID", label: "Pagados" },
                            { value: "PENDING", label: "Pendientes" },
                        ]}
                        placeholder="Todos"
                    />
                </div>

                <div className="tf-divider" />

                {/* ================= ACREEDOR ================= */}
                <div className="tf-group">
                    <div className="tf-field">
                        <label className="tf-group-label">Acreedor</label>
                        <input
                            type="text"
                            placeholder="Nombre del acreedor"
                            value={query.lender ?? ""}
                            onChange={(e) => set("lender", e.target.value)}
                            className="tf-input"
                        />
                    </div>
                </div>

                <div className="tf-divider" />

                {/* ================= FECHA DE INICIO DEL PRÉSTAMO ================= */}
                <div className="tf-group">
                    <span className="tf-group-label">Fecha de inicio del préstamo</span>
                    <div className="grid grid-cols-2 gap-3">
                        <DatePicker
                            label="Desde"
                            value={query.from ?? ""}
                            onChange={(value) => set("from", value)}
                            disableFuture={true}
                        />
                        <DatePicker
                            label="Hasta"
                            value={query.to ?? ""}
                            onChange={(value) => set("to", value)}
                            disableFuture={true}
                        />
                    </div>
                </div>

                <div className="tf-divider" />

                {/* ================= MONTO PRINCIPAL ================= */}
                <div className="tf-group">
                    <span className="tf-group-label">Monto principal (S/)</span>
                    <div className="grid grid-cols-2 gap-3">
                        <NumericInput
                            label="Mínimo"
                            value={query.minAmount ? String(query.minAmount) : ""}
                            onChange={(value) =>
                                set("minAmount", value ? Number(value) : undefined)
                            }
                            placeholder="0.00"
                            symbol="S/"
                            min={0}
                        />
                        <NumericInput
                            label="Máximo"
                            value={query.maxAmount ? String(query.maxAmount) : ""}
                            onChange={(value) =>
                                set("maxAmount", value ? Number(value) : undefined)
                            }
                            placeholder="0.00"
                            symbol="S/"
                            min={0}
                        />
                    </div>
                </div>

                <div className="tf-divider" />

                {/* ================= FILTROS DE PAGOS ================= */}
                <div className="tf-group">
                    <span className="tf-group-label">Pagos realizados</span>
                    <div className="tf-chips">
                        {[
                            { value: undefined, label: "Todos" },
                            { value: true, label: "Con pagos" },
                            { value: false, label: "Sin pagos" },
                        ].map((opt) => (
                            <button
                                key={String(opt.value)}
                                type="button"
                                className={`tf-chip ${query.hasPayments === opt.value ? "active" : ""}`}
                                onClick={() => set("hasPayments", opt.value as any)}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="tf-divider" />

                {/* ================= RANGO DE MONTO DE PAGOS ================= */}
                <div className="tf-group">
                    <span className="tf-group-label">Monto de pagos (S/)</span>
                    <div className="grid grid-cols-2 gap-3">
                        <NumericInput
                            label="Mínimo"
                            value={query.minPaymentAmount ? String(query.minPaymentAmount) : ""}
                            onChange={(value) =>
                                set("minPaymentAmount", value ? Number(value) : undefined)
                            }
                            placeholder="0.00"
                            symbol="S/"
                            min={0}
                        />
                        <NumericInput
                            label="Máximo"
                            value={query.maxPaymentAmount ? String(query.maxPaymentAmount) : ""}
                            onChange={(value) =>
                                set("maxPaymentAmount", value ? Number(value) : undefined)
                            }
                            placeholder="0.00"
                            symbol="S/"
                            min={0}
                        />
                    </div>
                </div>

                <div className="tf-divider" />

                {/* ================= FECHA DE PAGOS ================= */}
                <div className="tf-group">
                    <span className="tf-group-label">Fecha de pagos</span>
                    <div className="grid grid-cols-2 gap-3">
                        <DatePicker
                            label="Desde"
                            value={query.paymentDateFrom ?? ""}
                            onChange={(value) => set("paymentDateFrom", value)}
                            disableFuture={true}
                        />
                        <DatePicker
                            label="Hasta"
                            value={query.paymentDateTo ?? ""}
                            onChange={(value) => set("paymentDateTo", value)}
                            disableFuture={true}
                        />
                    </div>
                </div>

                <div className="tf-divider" />

                {/* ================= ORDENAMIENTO ================= */}
                <div className="tf-group">
                    <SelectInput
                        label="Ordenar por"
                        value={query.orderBy ?? ""}
                        onChange={(value) => set("orderBy", value as "startDate" | "createdAt" | "principalAmount")}
                        options={[
                            { value: "startDate", label: "Fecha de inicio" },
                            { value: "createdAt", label: "Fecha de creación" },
                            { value: "principalAmount", label: "Monto principal" },
                        ]}
                        placeholder="Selecciona ordenamiento"
                    />
                </div>

            </div>

        </FilterWrapper>
    )

}