import dayjs from "dayjs";
import "dayjs/locale/es";
import { formatCurrency } from "../../../shared/utils/formatCurrency";
import type { Transaction } from "../types";

dayjs.locale("es");

/**
 * Convierte una Transaction en un string buscable,
 * normalizando los campos tal como se renderizan en TransactionItem.
 */
export function normalizeTransaction(tx: Transaction): string {
    return [
        tx.name,
        tx.description,
        tx.category?.name,
        tx.account?.name,
        tx.relatedAccount?.name,
        formatCurrency(tx.amount),                        // "S/ 150.00"
        dayjs(tx.date).locale("es").format("dddd D"),     // "lunes 2"
        dayjs(tx.date).locale("es").format("MMMM YYYY"),  // "junio 2025" — búsqueda por mes
    ]
        .filter(Boolean)
        .join(" ");
}