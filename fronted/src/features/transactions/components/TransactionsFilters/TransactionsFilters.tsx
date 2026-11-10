import { useMemo, useState } from "react";
import dayjs from "dayjs";
import "dayjs/locale/es";
import { useCategories } from "../../../categories/hooks";
import { useAccounts } from "../../../accounts/hooks";
import { FilterWrapper, type FilterBadgeItem } from "../../../../shared/components/FilterWrapper/FilterWrapper";
import "./TransactionsFilters.css";
import { RangeExactGroup } from "../../../../shared/components/RangeExactGroup/RangeExactGroup";
import { DatePicker } from "../../../../shared/components/DateInput/DateInput";
import { NumericInput } from "../../../../shared/components/NumericInput/NumericInput";
import type { TransactionQuerySchemaOutput } from "../../types";
import { SearchInput } from "../../../../shared/components/SearchInput/SearchInput";
import { SelectInput } from "../../../../shared/components/SelectInput/SelectInput";
import { formatCurrency } from "../../../../shared/utils/formatCurrency";

interface Props {
    query: TransactionQuerySchemaOutput;
    onChange: (q: TransactionQuerySchemaOutput) => void;
    onReset: () => void;
    search: string;
    onSearchChange: (value: string) => void;
}

type DateMode = "range" | "exact";
type AmountMode = "range" | "exact";
type Period = "all" | "today" | "7d" | "lastWeek" | "month" | "lastMonth";

dayjs.locale("es");

const TYPE_OPTIONS: { value: TransactionQuerySchemaOutput["type"]; label: string }[] = [
    { value: undefined, label: "Todos" },
    { value: "INCOME", label: "Ingresos" },
    { value: "EXPENSE", label: "Gastos" },
    { value: "TRANSFER", label: "Transferencias" },
    { value: "CREDIT_PAYMENT", label: "Pago tarjeta" },
];

const ORDER_OPTIONS = [
    { value: "date-DESC", label: "Más recientes", orderBy: "date" as const, order: "DESC" as const },
    { value: "date-ASC", label: "Más antiguos", orderBy: "date" as const, order: "ASC" as const },
    { value: "amount-DESC", label: "Mayor monto", orderBy: "amount" as const, order: "DESC" as const },
    { value: "amount-ASC", label: "Menor monto", orderBy: "amount" as const, order: "ASC" as const },
    { value: "name-ASC", label: "Nombre A-Z", orderBy: "name" as const, order: "ASC" as const },
];

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
    { value: "all", label: "Todo" },
    { value: "today", label: "Hoy" },
    { value: "7d", label: "7 días" },
    { value: "lastWeek", label: "Semana pasada" },
    { value: "month", label: "Este mes" },
    { value: "lastMonth", label: "Mes anterior" },
];

const KEY_LABELS: Record<string, string> = {
    type: "Tipo",
    accountId: "Cuenta",
    relatedAccountId: "Cuenta relacionada",
    categoryId: "Categoría",
    date: "Fecha",
    from: "Desde",
    to: "Hasta",
    amount: "Monto",
    minAmount: "Monto mín.",
    maxAmount: "Monto máx.",
    search: "Búsqueda",
};

const formatDate = (value?: string) => (value ? dayjs(value).format("DD/MM/YYYY") : "");

export default function TransactionFilters({ query, onChange, onReset, search, onSearchChange }: Props) {
    const { categories } = useCategories();
    const { accounts } = useAccounts();
    const [open, setOpen] = useState(false);

    const [dateMode, setDateMode] = useState<DateMode>(query.date ? "exact" : "range");
    const [amountMode, setAmountMode] = useState<AmountMode>(query.amount ? "exact" : "range");

    // `value || undefined` rompía filtros con 0/false; solo vaciamos strings vacíos.
    const set = <K extends keyof TransactionQuerySchemaOutput>(
        key: K,
        value: TransactionQuerySchemaOutput[K]
    ) => {
        onChange({ ...query, [key]: value === "" ? undefined : value });
    };

    const period = useMemo<Period>(() => {
        const today = dayjs().format("YYYY-MM-DD");
        const from = query.from;
        const to = query.to;
        if (!from && !to) return "all";
        if (from === today && to === today) return "today";
        if (from === dayjs().subtract(6, "day").format("YYYY-MM-DD") && to === today) return "7d";

        const lastWeek = dayjs().subtract(1, "week");
        if (
            from === lastWeek.startOf("week").format("YYYY-MM-DD") &&
            to === lastWeek.endOf("week").format("YYYY-MM-DD")
        ) return "lastWeek";

        if (from === dayjs().startOf("month").format("YYYY-MM-DD") && to === today) return "month";
        if (
            from === dayjs().subtract(1, "month").startOf("month").format("YYYY-MM-DD") &&
            to === dayjs().subtract(1, "month").endOf("month").format("YYYY-MM-DD")
        ) return "lastMonth";
        return "all";
    }, [query.from, query.to]);

    const monthOptions = useMemo(
        () => Array.from({ length: 12 }, (_, index) => {
            const month = dayjs().subtract(index, "month");
            return {
                value: month.format("YYYY-MM"),
                label: month.format("MMMM YYYY"),
            };
        }),
        []
    );

    const weekOptions = useMemo(
        () => Array.from({ length: 8 }, (_, index) => {
            const week = dayjs().subtract(index, "week");
            const start = week.startOf("week");
            const end = week.endOf("week");
            return {
                value: start.format("YYYY-MM-DD"),
                label: `Semana ${start.format("D MMM")} - ${end.format("D MMM")}`,
            };
        }),
        []
    );

    const selectedMonth = useMemo(() => {
        if (!query.from || !query.to) return "";
        const from = dayjs(query.from);
        const to = dayjs(query.to);
        const isFullMonth =
            from.isSame(from.startOf("month"), "day") &&
            to.isSame(to.endOf("month"), "day");
        const isCurrentMonthToToday =
            from.isSame(from.startOf("month"), "day") &&
            to.isSame(dayjs().startOf("day"), "day");
        return isFullMonth || isCurrentMonthToToday ? from.format("YYYY-MM") : "";
    }, [query.from, query.to]);

    const selectedWeek = useMemo(() => {
        if (!query.from || !query.to) return "";
        const from = dayjs(query.from);
        const to = dayjs(query.to);
        return from.isSame(from.startOf("week"), "day") &&
            to.isSame(to.endOf("week"), "day")
            ? from.format("YYYY-MM-DD")
            : "";
    }, [query.from, query.to]);

    const applyMonth = (value: string) => {
        if (!value) {
            onChange({ ...query, from: undefined, to: undefined, date: undefined, page: 1 });
            return;
        }
        const month = dayjs(`${value}-01`);
        onChange({
            ...query,
            date: undefined,
            from: month.startOf("month").format("YYYY-MM-DD"),
            to: month.endOf("month").format("YYYY-MM-DD"),
            page: 1,
        });
    };

    const applyWeek = (value: string) => {
        if (!value) {
            onChange({ ...query, from: undefined, to: undefined, date: undefined, page: 1 });
            return;
        }
        const week = dayjs(value);
        onChange({
            ...query,
            date: undefined,
            from: week.startOf("week").format("YYYY-MM-DD"),
            to: week.endOf("week").format("YYYY-MM-DD"),
            page: 1,
        });
    };

    const applyPeriod = (value: Period) => {
        const today = dayjs();
        const next = { ...query, date: undefined };

        if (value === "all") {
            next.from = undefined;
            next.to = undefined;
        } else if (value === "today") {
            next.from = today.format("YYYY-MM-DD");
            next.to = today.format("YYYY-MM-DD");
        } else if (value === "7d") {
            next.from = today.subtract(6, "day").format("YYYY-MM-DD");
            next.to = today.format("YYYY-MM-DD");
        } else if (value === "lastWeek") {
            const lastWeek = today.subtract(1, "week");
            next.from = lastWeek.startOf("week").format("YYYY-MM-DD");
            next.to = lastWeek.endOf("week").format("YYYY-MM-DD");
        } else if (value === "month") {
            next.from = today.startOf("month").format("YYYY-MM-DD");
            next.to = today.format("YYYY-MM-DD");
        } else {
            const previous = today.subtract(1, "month");
            next.from = previous.startOf("month").format("YYYY-MM-DD");
            next.to = previous.endOf("month").format("YYYY-MM-DD");
        }

        onChange({ ...next, page: 1 });
    };

    const orderValue = `${query.orderBy ?? "date"}-${query.order ?? "DESC"}`;

    const activeCount = Object.entries(query).filter(([key, value]) => {
        if (["page", "limit", "order", "orderBy"].includes(key)) return false;
        return value !== undefined && value !== "";
    }).length;

    const activeFilter: FilterBadgeItem[] = [];

    for (const key in query) {
        if (["page", "limit", "order", "orderBy"].includes(key)) continue;

        const queryKey = key as keyof typeof query;
        const rawValue = query[queryKey];
        if (rawValue === undefined || rawValue === "") continue;

        let label = String(rawValue);
        let color: string | undefined;

        if (key === "type") {
            label = TYPE_OPTIONS.find((opt) => opt.value === query.type)?.label ?? label;
        } else if (key === "categoryId") {
            const category = categories.find((cat) => cat.id === rawValue);
            if (category) {
                label = category.name;
                color = category.color;
            }
        } else if (key === "accountId" || key === "relatedAccountId") {
            const account = accounts.find((acc) => acc.id === rawValue);
            if (account) label = account.name;
        } else if (["amount", "minAmount", "maxAmount"].includes(key)) {
            const amount = Number(rawValue);
            if (!Number.isNaN(amount)) label = formatCurrency(amount);
        } else if (key === "from" || key === "to" || key === "date") {
            label = formatDate(String(rawValue));
        }

        activeFilter.push({
            key,
            name: KEY_LABELS[key] ?? key,
            label,
            color,
        });
    }

    const removeFilter = (key: keyof typeof query) => {
        onChange({ ...query, [key]: undefined });
    };

    return (
        <FilterWrapper<TransactionQuerySchemaOutput>
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
                    placeholder="Buscar por nombre, categoría, cuenta..."
                />
            }
            orderElement={
                <SelectInput
                    compact
                    label="Ordenar por"
                    hideLabel
                    value={orderValue}
                    onChange={(value) => {
                        const option = ORDER_OPTIONS.find((opt) => opt.value === value);
                        if (!option) return;
                        onChange({ ...query, orderBy: option.orderBy, order: option.order });
                    }}
                    options={ORDER_OPTIONS.map(({ value, label }) => ({ value, label }))}
                />
            }
        >
            <div className="space-y-4">

                {/* ================= PERIODO RÁPIDO ================= */}
                <div className="tf-group">
                    <span className="tf-group-label">Periodo</span>
                    <div className="tf-chips">
                        {PERIOD_OPTIONS.map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                className={`tf-chip ${period === opt.value ? "active" : ""}`}
                                onClick={() => applyPeriod(opt.value)}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>

                    <div className="tf-period-selectors">
                        <SelectInput
                            compact
                            label="Mes específico"
                            hideLabel
                            value={selectedMonth}
                            onChange={applyMonth}
                            placeholder="Mes específico"
                            options={monthOptions}
                            className="tf-field-select"
                        />
                        <SelectInput
                            compact
                            label="Semana específica"
                            hideLabel
                            value={selectedWeek}
                            onChange={applyWeek}
                            placeholder="Semana específica"
                            options={weekOptions}
                            className="tf-field-select"
                        />
                    </div>
                </div>

                <div className="tf-divider" />

                {/* ================= TIPO ================= */}
                <div className="tf-group">
                    <span className="tf-group-label">Tipo</span>
                    <div className="tf-chips">
                        {TYPE_OPTIONS.map((opt) => (
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

                {/* ================= FECHA Y MONTO ================= */}
                <div className="grid-auto-tall tf-fields-grid">
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
                            setAmountMode(mode);
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

                {/* ================= CATEGORÍA, CUENTA Y RELACIONADA ================= */}
                <div className="tf-row">
                    <div className="tf-group tf-group--third">
                        <span className="tf-group-label">Categoría</span>
                        <SelectInput
                            label="Categoría"
                            hideLabel
                            value={query.categoryId ?? ""}
                            onChange={(v) => set("categoryId", v)}
                            placeholder="Todas"
                            options={categories.map((cat) => ({
                                value: cat.id,
                                label: cat.name,
                                color: cat.color,
                            }))}
                            className="tf-field-select"
                        />
                    </div>

                    <div className="tf-group tf-group--third">
                        <span className="tf-group-label">Cuenta</span>
                        <SelectInput
                            label="Cuenta"
                            hideLabel
                            value={query.accountId ?? ""}
                            onChange={(v) => set("accountId", v)}
                            placeholder="Todas"
                            options={accounts.map((acc) => ({
                                value: acc.id,
                                label: acc.name,
                            }))}
                            className="tf-field-select"
                        />
                    </div>

                    <div className="tf-group tf-group--third">
                        <span className="tf-group-label">Cuenta relacionada</span>
                        <SelectInput
                            label="Cuenta relacionada"
                            hideLabel
                            value={query.relatedAccountId ?? ""}
                            onChange={(v) => set("relatedAccountId", v)}
                            placeholder="Todas"
                            options={accounts.map((acc) => ({
                                value: acc.id,
                                label: acc.name,
                            }))}
                            className="tf-field-select"
                        />
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
