import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import "dayjs/locale/es";
import { useCategories } from "../../../features/categories/hooks";
import { CategoryForm } from "../../../features/categories/components/CategoryForm/CategoryForm";
import { CategoryDetail } from "../../../features/categories/components/CategoryDetail/CategoryDetail";
import { TYPE_LABELS, normalizeText } from "../../../features/categories/constants";
import type { Category } from "../../../features/categories/types";
import { getIcon } from "../../../shared/utils/GetIcon";
import { formatCurrency } from "../../../shared/utils/formatCurrency";
import LoadingScreen from "../../../shared/components/LoadingScreen/LoadingScreen";
import { useToast } from "../../../shared/Hooks/useToast";
import { SearchInput } from "../../../shared/components/SearchInput/SearchInput";
import { SelectInput } from "../../../shared/components/SelectInput/SelectInput";
import ModalPortal from "../../../shared/components/ModalPortal/ModalPortal";
import InfoModal from "../../../shared/components/InfoModal/InfoModal";
import { Plus, Pencil, Trash2, TrendingDown, TrendingUp, CalendarDays } from "lucide-react";
import "./Categories.css";

dayjs.locale("es");

type SortMode = "az" | "za" | "usage";

const MONTH_OPTIONS = [
    { value: "", label: "Todo el tiempo" },
    ...Array.from({ length: 12 }, (_, index) => {
        const month = dayjs().subtract(index, "month");
        return {
            value: month.format("YYYY-MM"),
            label: month.format("MMMM YYYY"),
        };
    }),
];

/* ------------------------------------------------------------------ */
/*  Fila de categoría                                                   */
/* ------------------------------------------------------------------ */
interface RowProps {
    cat: Category;
    share: number;
    showType?: boolean;
    deletePending: boolean;
    onOpen: (cat: Category) => void;
    onEdit: (cat: Category) => void;
    onDelete: (cat: Category) => void;
}

function CategoryRow({ cat, share, showType, deletePending, onOpen, onEdit, onDelete }: RowProps) {
    const count = cat.transactionCount ?? 0;
    const pct = Math.round(share);

    return (
        <div className="category-item">
                <button
                    type="button"
                    className="category-item-main tooltip-top"
                    onClick={() => onOpen(cat)}
                    data-tooltip={`Ver detalle de ${cat.name}`}
                >
                <div className="category-item-left">
                    <div className="category-dot" style={{ background: cat.color }} />
                    <div
                        className="category-icon-wrap"
                        style={{ background: cat.color + "20", color: cat.color }}
                    >
                        {cat.icon ? getIcon(cat.icon) : getIcon("Tag")}
                    </div>
                    <div className="category-item-text">
                        <div className="category-item-title">
                            <span className="category-name">{cat.name}</span>
                            {cat.isBase && (
                                <span
                                    className="cat-base-badge tooltip-top tooltip-anchor"
                                    data-tooltip="Categoría base del sistema: no se puede eliminar"
                                >
                                    Sistema
                                </span>
                            )}
                            {showType && <span className="cat-type-badge">{TYPE_LABELS[cat.type] ?? cat.type}</span>}
                        </div>
                        <span className="cat-usage">
                            {count} transacción{count !== 1 ? "es" : ""} · {formatCurrency(cat.totalAmount ?? 0)}
                        </span>
                    </div>
                </div>

                <div className="cat-share" aria-hidden="true">
                    <span className="cat-share-bar">
                        <span className="cat-share-fill" style={{ width: `${pct}%`, background: cat.color }} />
                    </span>
                    <span className="cat-share-pct">{pct}%</span>
                </div>
            </button>

            <div className="category-actions">
                <button
                    type="button"
                    className="category-edit-btn tooltip-left"
                    onClick={() => onEdit(cat)}
                    aria-label={`Editar ${cat.name}`}
                    data-tooltip={`Editar ${cat.name}`}
                >
                    <Pencil size={14} />
                </button>
                <button
                    type="button"
                    className="category-delete-btn tooltip-left"
                    onClick={() => onDelete(cat)}
                    disabled={cat.isBase || deletePending}
                    aria-label={`Eliminar ${cat.name}`}
                    data-tooltip={
                        cat.isBase
                            ? "No puedes eliminar categorías del sistema"
                            : deletePending
                                ? "Eliminando…"
                                : `Eliminar ${cat.name}`
                    }
                >
                    <Trash2 size={14} />
                </button>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Página                                                              */
/* ------------------------------------------------------------------ */
export default function CategoriesPage() {
    const [month, setMonth] = useState(() => dayjs().format("YYYY-MM"));
    const navigate = useNavigate();

    const {
        categories,
        loading,
        isError,
        error,
        refetch,
        createCategory,
        updateCategory,
        deleteCategory,
    } = useCategories(month || undefined);

    const [search, setSearch] = useState("");
    const [sort, setSort] = useState<SortMode>("az");
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<Category | null>(null);
    const [detail, setDetail] = useState<Category | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [pendingDelete, setPendingDelete] = useState<Category | null>(null);
    const toast = useToast();

    const summary = useMemo(() => {
        const expenses = categories.filter((cat) => cat.type === "EXPENSE");
        const incomes = categories.filter((cat) => cat.type === "INCOME");
        return {
            expenseTotal: expenses.reduce((sum, cat) => sum + (cat.totalAmount ?? 0), 0),
            incomeTotal: incomes.reduce((sum, cat) => sum + (cat.totalAmount ?? 0), 0),
            activeCount: categories.filter((cat) => (cat.transactionCount ?? 0) > 0).length,
        };
    }, [categories]);

    const monthLabel = month ? dayjs(`${month}-01`).format("MMMM YYYY") : "todo el tiempo";
    const expenseLabel = month ? `Gastos de ${monthLabel}` : "Gastos totales";
    const incomeLabel = month ? `Ingresos de ${monthLabel}` : "Ingresos totales";
    const monthFrom = month ? `${month}-01` : "";
    const monthTo = month ? dayjs(`${month}-01`).endOf("month").format("YYYY-MM-DD") : "";

    const openTransactions = (type: "EXPENSE" | "INCOME") => {
        const params = new URLSearchParams({ type });
        if (monthFrom) {
            params.set("from", monthFrom);
            params.set("to", monthTo);
        }
        navigate(`/transactions?${params.toString()}`);
    };

    const visible = useMemo(() => {
        const q = normalizeText(search);
        const list = q ? categories.filter((c) => normalizeText(c.name).includes(q)) : categories;
        return [...list].sort((a, b) => {
            if (sort === "az") return a.name.localeCompare(b.name, "es");
            if (sort === "za") return b.name.localeCompare(a.name, "es");
            const byCount = (b.transactionCount ?? 0) - (a.transactionCount ?? 0);
            return byCount !== 0 ? byCount : (b.totalAmount ?? 0) - (a.totalAmount ?? 0);
        });
    }, [categories, search, sort]);

    const grouped = {
        EXPENSE: visible.filter((c) => c.type === "EXPENSE"),
        INCOME: visible.filter((c) => c.type === "INCOME"),
        OTHER: visible.filter((c) => c.type !== "EXPENSE" && c.type !== "INCOME"),
    };

    const shareOf = (list: Category[], cat: Category) => {
        const groupTotal = list.reduce((sum, c) => sum + (c.totalAmount ?? 0), 0);
        return groupTotal > 0 ? ((cat.totalAmount ?? 0) / groupTotal) * 100 : 0;
    };

    const handleDelete = (cat: Category) => {
        if (cat.isBase || deleteCategory.isPending) return;
        setDeleteError(null);
        setPendingDelete(cat);
    };

    const confirmDelete = () => {
        if (!pendingDelete || deleteCategory.isPending) return;
        deleteCategory.mutate(pendingDelete.id, {
            // Cierra en ambos casos: en éxito desaparece, en error se muestra
            // el banner deleteError detrás del modal.
            onSettled: () => setPendingDelete(null),
            onSuccess: () => toast.success("Categoría eliminada"),
            onError: (err) => setDeleteError(err.message || "No se pudo eliminar la categoría"),
        });
    };

    const renderList = (list: Category[], showType = false) => (
        <div className="category-list">
            {list.length === 0 ? (
                <p className="text-muted category-empty">Sin categorías</p>
            ) : (
                list.map((cat) => (
                    <CategoryRow
                        key={cat.id}
                        cat={cat}
                        share={shareOf(list, cat)}
                        showType={showType}
                        deletePending={deleteCategory.isPending}
                        onOpen={setDetail}
                        onEdit={setEditing}
                        onDelete={handleDelete}
                    />
                ))
            )}
        </div>
    );

    if (loading) return <LoadingScreen message="Cargando categorías..." />;

    if (isError) {
        return (
            <div className="page-container categories-page">
                <header className="page-header card">
                    <div>
                        <h1>Categorías</h1>
                        <p className="text-muted">Organiza tus ingresos y gastos</p>
                    </div>
                </header>
                <div className="card cat-error-card">
                    <p>No se pudieron cargar las categorías.</p>
                    <p className="text-muted">{error?.message || "Error inesperado"}</p>
                    <button type="button" className="btn-primary" onClick={() => refetch()}>
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container categories-page">
            <header className="page-header card categories-header">
                <div>
                    <h1>Categorías</h1>
                    <p className="text-muted">Organiza tus ingresos y gastos</p>
                </div>
                <div className="categories-toolbar">
                    <SearchInput value={search} onChange={setSearch} placeholder="Buscar categoría..." />
                    <SelectInput
                        compact
                        label="Filtrar por mes"
                        hideLabel
                        value={month}
                        onChange={setMonth}
                        options={MONTH_OPTIONS}
                        className="cat-sort-select cat-month-select"
                    />
                    <SelectInput
                        compact
                        label="Ordenar categorías"
                        hideLabel
                        value={sort}
                        onChange={(v) => setSort(v as SortMode)}
                        options={[
                            { value: "az", label: "A-Z" },
                            { value: "za", label: "Z-A" },
                            { value: "usage", label: "Más usadas" },
                        ]}
                        className="cat-sort-select"
                    />
                    <button
                        type="button"
                        className="btn-primary"
                        onClick={() => {
                            setDeleteError(null);
                            setShowForm(true);
                        }}
                    >
                        <Plus size={18} />
                        Nueva categoría
                    </button>
                </div>
            </header>

            <section className="cat-summary">
                <button
                    type="button"
                    className="cat-summary-card cat-summary-card--expense cat-summary-card--link"
                    onClick={() => openTransactions("EXPENSE")}
                >
                    <span className="cat-summary-icon"><TrendingDown size={17} /></span>
                    <div>
                        <span className="cat-summary-label">{expenseLabel}</span>
                        <strong className="amount-font">{formatCurrency(summary.expenseTotal)}</strong>
                    </div>
                </button>

                <button
                    type="button"
                    className="cat-summary-card cat-summary-card--income cat-summary-card--link"
                    onClick={() => openTransactions("INCOME")}
                >
                    <span className="cat-summary-icon"><TrendingUp size={17} /></span>
                    <div>
                        <span className="cat-summary-label">{incomeLabel}</span>
                        <strong className="amount-font">{formatCurrency(summary.incomeTotal)}</strong>
                    </div>
                </button>

                <article className="cat-summary-card cat-summary-card--active">
                    <span className="cat-summary-icon"><CalendarDays size={17} /></span>
                    <div>
                        <span className="cat-summary-label">Categorías con movimientos</span>
                        <strong className="amount-font">{summary.activeCount}</strong>
                    </div>
                </article>
            </section>

            {deleteError && (
                <div className="cat-error-banner" role="alert">
                    <span>{deleteError}</span>
                    <button
                        type="button"
                        onClick={() => setDeleteError(null)}
                        aria-label="Cerrar aviso"
                        data-tooltip="Cerrar aviso"
                        className="tooltip-left tooltip-anchor"
                    >
                        ✕
                    </button>
                </div>
            )}

            {categories.length === 0 ? (
                <div className="card cat-empty-card">
                    <p>Aún no tienes categorías.</p>
                    <p className="text-muted">Crea la primera para organizar tus transacciones.</p>
                    <button type="button" className="btn-primary" onClick={() => setShowForm(true)}>
                        <Plus size={18} />
                        Nueva categoría
                    </button>
                </div>
            ) : visible.length === 0 ? (
                <div className="card cat-empty-card">
                    <p>No se encontraron categorías para «{search}».</p>
                    <button type="button" className="btn-ghost" onClick={() => setSearch("")}>
                        Limpiar búsqueda
                    </button>
                </div>
            ) : (
                <>
                    <div className="categories-grid">
                        {(["EXPENSE", "INCOME"] as const).map((type) => (
                            <div key={type} className="card">
                                <div className="card-head">
                                    <h3 className="card-head-title">
                                        {type === "INCOME" ? "Ingresos" : "Gastos"}
                                        <span className="category-count">{grouped[type].length}</span>
                                    </h3>
                                </div>
                                {renderList(grouped[type])}
                            </div>
                        ))}
                    </div>

                    {grouped.OTHER.length > 0 && (
                        <div className="card">
                            <div className="card-head">
                                <h3 className="card-head-title">
                                    Otros
                                    <span className="category-count">{grouped.OTHER.length}</span>
                                </h3>
                            </div>
                            {renderList(grouped.OTHER, true)}
                        </div>
                    )}
                </>
            )}

            {/* ── Modal: crear ─────────────────────────────────────────── */}
            <ModalPortal isOpen={showForm} onClose={() => setShowForm(false)}>
                <CategoryForm
                    mutation={createCategory}
                    onSuccess={() => setShowForm(false)}
                    onClose={() => setShowForm(false)}
                />
            </ModalPortal>

            {/* ── Modal: editar ────────────────────────────────────────── */}
            <ModalPortal isOpen={!!editing} onClose={() => setEditing(null)}>
                {editing && (
                    <CategoryForm
                        mutation={updateCategory}
                        category={editing}
                        isEdit
                        onSuccess={() => setEditing(null)}
                        onClose={() => setEditing(null)}
                    />
                )}
            </ModalPortal>

            {/* ── Modal: detalle de uso ────────────────────────────────── */}
            <ModalPortal isOpen={!!detail} onClose={() => setDetail(null)}>
                {detail && (
                    <CategoryDetail
                        category={detail}
                        month={month || undefined}
                        onClose={() => setDetail(null)}
                    />
                )}
            </ModalPortal>

            {/* ── Confirmación de borrado ──────────────────────────────── */}
            <InfoModal
                isOpen={!!pendingDelete}
                onClose={() => setPendingDelete(null)}
                onConfirm={confirmDelete}
                type="error"
                title="Eliminar categoría"
                message={`¿Eliminar la categoría "${pendingDelete?.name}"? Esta acción no se puede deshacer.`}
                confirmText={deleteCategory.isPending ? "Eliminando…" : "Eliminar"}
                cancelText="Cancelar"
                confirmDisabled={deleteCategory.isPending}
            />
        </div>
    );
}
