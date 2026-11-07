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
    onClose: () => void;
}

export function CategoryDetail({ category, onClose }: Props) {
    const { data, isLoading, isError, error } = useQuery({
        queryKey: ["categories", "detail", category.id],
        queryFn: () => getCategoryById(category.id),
        staleTime: 30_000,
    });

    const transactions = (data?.transactions ?? []).slice(0, 10);
    const count = category.transactionCount ?? data?.transactions?.length ?? 0;
    const total = category.totalAmount ?? 0;

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
                <h3>Últimas transacciones</h3>

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
                                {isOut ? "−" : "+"} {formatCurrency(tx.amount)}
                            </span>
                        </div>
                    );
                })}
            </section>

            <footer className="cat-detail-footer">
                <Link
                    className="btn-primary cat-detail-link"
                    to={`/transactions?categoryId=${category.id}`}
                    onClick={onClose}
                >
                    <ExternalLink size={15} />
                    Ver en transacciones
                </Link>
            </footer>
        </div>
    );
}
