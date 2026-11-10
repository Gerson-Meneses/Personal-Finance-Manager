import { useState } from "react";
import type { LoanQueryFilters } from "../../types";
import { FilterWrapper, type FilterBadgeItem } from "../../../../shared/components/FilterWrapper/FilterWrapper";
import { SelectInput } from "../../../../shared/components/SelectInput/SelectInput";
import { DatePicker } from "../../../../shared/components/DateInput/DateInput";
import { NumericInput } from "../../../../shared/components/NumericInput/NumericInput";
import { SearchInput } from "../../../../shared/components/SearchInput/SearchInput";
import "../../../transactions/components/TransactionsFilters/TransactionsFilters.css";


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
        onChange({ ...query, [key]: value === "" ? undefined : value });
    };

    const activeCount = Object.entries(query).filter(([key, value]) => {
        if (key === "page" || key === "limit" || key === "order" || key === "orderBy") return false;
        return value !== undefined && value !== "";
    }).length;

    const activeFilter: FilterBadgeItem[] = []

    const FILTER_LABELS: Record<string, string> = {
        type: "Tipo",
        status: "Estado",
        lender: "Persona",
        startDate: "Fecha inicio",
        from: "Desde",
        to: "Hasta",
        minAmount: "Monto mín.",
        maxAmount: "Monto máx.",
        hasPayments: "Pagos",
        minPaymentAmount: "Pago mín.",
        maxPaymentAmount: "Pago máx.",
        paymentDateFrom: "Pago desde",
        paymentDateTo: "Pago hasta",
    };

    for (const key in query) {
        if (key === "page" || key === "limit" || key === "order" || key === "orderBy") continue;

        const queryKey = key as keyof typeof query;
        const value = query[queryKey];

        if (value !== undefined && value !== "") {
            let label = String(value);

            if (key === "type") label = value === "GIVEN" ? "Otorgué" : "Recibí";
            else if (key === "status") label = value === "PAID" ? "Pagados" : "Pendientes";
            else if (key === "hasPayments") label = value ? "Con pagos" : "Sin pagos";
            else if (["minAmount", "maxAmount", "minPaymentAmount", "maxPaymentAmount"].includes(key)) {
                label = `S/ ${Number(value).toLocaleString("es-PE", { minimumFractionDigits: 2 })}`;
            }

            activeFilter.push({
                key: key,
                name: FILTER_LABELS[key] ?? key,
                label
            });
        }
    }

    const removeFilter = (key: keyof typeof query) => {
        onChange({ ...query, [key]: undefined })
    }

    return (
        <FilterWrapper<LoanQueryFilters>
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
                <SelectInput
                    compact
                    label="Ordenar por"
                    hideLabel
                    value={query.order ?? "DESC"}
                    onChange={(v) => set("order", v as "ASC" | "DESC")}
                    options={[
                        { value: "DESC", label: "Más recientes" },
                        { value: "ASC", label: "Más antiguos" },
                    ]}
                />
            }
        >
            {/* 🎯 PANEL DESPLEGABLE DE FILTROS AVANZADOS */}
            <div className="space-y-4">

                {/* ================= TIPO ================= */}
                <div className="tf-group">
                    <span className="tf-group-label">Tipo de préstamo</span>
                    <div className="tf-chips">
                        {([
                            { value: undefined, label: "Todos" },
                            { value: "RECEIVED", label: "Recibí" },
                            { value: "GIVEN", label: "Otorgué" },
                        ] as { value: LoanQueryFilters["type"]; label: string }[]).map((opt) => (
                            <button
                                key={opt.label}
                                type="button"
                                className={`tf-chip ${query.type === opt.value ? "active" : ""}`}
                                onClick={() => set("type", opt.value)}
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
                        value={query.status ?? ""}
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
                        {([
                            { value: undefined, label: "Todos" },
                            { value: true, label: "Con pagos" },
                            { value: false, label: "Sin pagos" },
                        ] as { value: boolean | undefined; label: string }[]).map((opt) => (
                            <button
                                key={String(opt.value)}
                                type="button"
                                className={`tf-chip ${query.hasPayments === opt.value ? "active" : ""}`}
                                onClick={() => set("hasPayments", opt.value)}
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
