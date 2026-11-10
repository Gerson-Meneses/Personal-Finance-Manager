import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import dayjs from "dayjs";
import { X, ExternalLink } from "lucide-react";
import { getCategoryById } from "../../services";
import { TYPE_LABELS } from "../../constants";
import type { Category } from "../../types";
import { getIcon } from "../../../../shared/utils/GetIcon";
import { formatCurrency } from "../../../../shared/utils/formatCurrency";
import "./CategoryDetail.css";

interface Props {
    category: Category;
    /** Mes YYYY-MM para limitar las transacciones mostradas */
    month?: string;
    onClose: () => void;
}

export function CategoryDetail({ category, month, onClose }: Props) {
    const { data, isLoading, isError, error } = useQuery({
        queryKey: ["categories", "detail", category.id],
        queryFn: () => getCategoryById(category.id),
        staleTime: 30_000,
    });

    const monthFrom = month ? `${month}-01` : "";
    const monthTo = month
        ? dayjs(`${month}-01`).endOf("month").format("YYYY-MM-DD")
        : "";
    const monthLabel = month ? dayjs(`${month}-01`).format("MMMM YYYY") : "";

    const allTransactions = data?.transactions ?? [];
    const monthTransactions = month
        ? allTransactions.filter((tx) => {
            const date = dayjs(tx.date).format("YYYY-MM-DD");
            return date >= monthFrom && date <= monthTo;
        })
        : allTransactions;

    const transactions = monthTransactions.slice(0, 10);
    const count = category.transactionCount ?? monthTransactions.length;
    const total = category.totalAmount ?? 0;

    const transactionsLink = month
        ? `/transactions?categoryId=${category.id}&from=${monthFrom}&to=${monthTo}`
        : `/transactions?categoryId=${category.id}`;

    return (
        <div className="cat-detail">
            <header className="cat-detail-header">
                <div
                    className="category-icon-wrap cat-detail-icon"
                    style={{ background: category.color + "20", color: category.color }}
                >
                    {category.icon ? getIcon(category.icon) : getIcon("Tag")}
                </div>
                <div className="cat-detail-title">
                    <h2>{category.name}</h2>
                    <div className="cat-detail-badges">
                        <span className="cat-detail-badge">{TYPE_LABELS[category.type] ?? category.type}</span>
                        {category.isBase && (
                            <span
                                className="cat-base-badge tooltip-top tooltip-anchor"
                                data-tooltip="Categoría base del sistema: no se puede eliminar"
                            >
                                Sistema
                            </span>
                        )}
                    </div>
                </div>
                <button
                    type="button"
                    className="cat-detail-close tooltip-left"
                    onClick={onClose}
                    aria-label="Cerrar detalle"
                    data-tooltip="Cerrar detalle"
                >
                    <X size={18} />
                </button>
            </header>

            <div className="cat-detail-stats">
                <div className="cat-detail-stat">
                    <span>Transacciones</span>
                    <strong>{count}</strong>
                </div>
                <div className="cat-detail-stat">
                    <span>Total acumulado</span>
                    <strong>{formatCurrency(total)}</strong>
                </div>
            </div>

            <section className="cat-detail-tx">
                <h3>
                    Últimas transacciones
                    {monthLabel && <span className="cat-detail-month"> · {monthLabel}</span>}
                </h3>

                {isLoading && <p className="text-muted">Cargando transacciones…</p>}
                {isError && (
                    <p className="text-muted">
                        No se pudieron cargar las transacciones ({error?.message || "error inesperado"})
                    </p>
                )}
                {!isLoading && !isError && transactions.length === 0 && (
                    <p className="text-muted">Sin transacciones registradas en esta categoría.</p>
                )}

                {transactions.map((tx) => {
                    const isOut = tx.type === "EXPENSE" || tx.type === "CREDIT_PAYMENT" || tx.type === "TRANSFER";
                    return (
                        <div key={tx.id} className="cat-detail-tx-row">
                            <div className="cat-detail-tx-info">
                                <span className="cat-detail-tx-name">{tx.name}</span>
                                <span className="cat-detail-tx-date">{dayjs(tx.date).format("DD/MM/YYYY")}</span>
                            </div>
                            <span className={`cat-detail-tx-amount ${isOut ? "out" : "in"}`}>
                                {isOut ? "−" : "+"} {formatCurrency(tx.amount / 100)}
                            </span>
                        </div>
                    );
                })}
            </section>

            <footer className="cat-detail-footer">
                <Link
                    className="btn-primary cat-detail-link"
                    to={transactionsLink}
                    onClick={onClose}
                >
                    <ExternalLink size={15} />
                    Ver en transacciones
                </Link>
            </footer>
        </div>
    );
}
