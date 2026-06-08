import { useMemo, useState } from "react";
import type { Loan } from "../../types";
import { LoanHistoryItem, type LoanHistoryMixedItem } from "./LoansHistory";
import { ListHistory } from "../../../../shared/components/ListHistory/ListHistory";
import { getIcon } from "../../../../shared/utils/GetIcon";
import "./LoanQuickHistory.css";

type OrderBy = "date" | "amount";
type Order = "ASC" | "DESC";

interface LoanQuickHistoryProps {
    loans: Loan[];
    search?: string;
    // orderBy y order ahora son opcionales — el estado vive aquí
    defaultOrderBy?: OrderBy;
    defaultOrder?: Order;
}

const ORDER_BY_OPTIONS: { value: OrderBy; label: string }[] = [
    { value: "date", label: "Fecha" },
    { value: "amount", label: "Monto" },
];

export const LoanQuickHistory = ({
    loans,
    search = "",
    defaultOrderBy = "date",
    defaultOrder = "DESC",
}: LoanQuickHistoryProps) => {
    const [orderBy, setOrderBy] = useState<OrderBy>(defaultOrderBy);
    const [order, setOrder] = useState<Order>(defaultOrder);

    const toggleOrder = () => setOrder((p) => (p === "ASC" ? "DESC" : "ASC"));

    const mixedHistory = useMemo(() => {
        const history: LoanHistoryMixedItem[] = [];

        loans.forEach((loan) => {
            history.push({
                ...loan,
                date: loan.startDate,
                amount: loan.principalAmount,
            });

            if (loan.paymentCount > 0 && loan.payments) {
                history.push(...loan.payments.map((payment) => ({ ...payment, type: loan.type })));
            }
        });

        history.sort((a, b) => {
            const valA = a[orderBy] ?? (orderBy === "date" ? "" : 0);
            const valB = b[orderBy] ?? (orderBy === "date" ? "" : 0);
            if (valA === valB) return 0;
            return order === "ASC"
                ? valA > valB ? 1 : -1
                : valA < valB ? 1 : -1;
        });

        return history;
    }, [loans, orderBy, order]);

    return (
        <div className="lqh-wrapper">
            {/* Controles de ordenamiento */}
            <div className="lqh-controls">
                <div className="tf-chips">
                    {ORDER_BY_OPTIONS.map((opt) => (
                        <button
                            key={opt.value}
                            type="button"
                            className={`tf-chip ${orderBy === opt.value ? "active" : ""}`}
                            onClick={() => setOrderBy(opt.value)}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>

                <button
                    type="button"
                    className="lqh-order-btn"
                    onClick={toggleOrder}
                    title={order === "ASC" ? "Más recientes primero" : "Más antiguos primero"}
                >
                    {order === "ASC"
                        ? getIcon("ArrowUpNarrowWide")
                        : getIcon("ArrowDownNarrowWide")
                    }
                    <span>{order === "ASC" ? "Ascendente" : "Descendente"}</span>
                </button>
            </div>

            <ListHistory
                title="Historial de movimientos:"
                groupByDate
                renderItem={(item) => (
                    <LoanHistoryItem item={item} search={search} />
                )}
                items={mixedHistory}
                emptyMessage="No se encontraron movimientos para mostrar."
            />
        </div>
    );
};