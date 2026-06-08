import dayjs from "dayjs";
import "dayjs/locale/es";
import { formatCurrency } from "../../../shared/utils/formatCurrency";
import type { Loan } from "../types";

dayjs.locale("es");

export function normalizeLoan(loan: Loan): string {
    const { transaction, payments } = loan;

    const paymentEntries = (payments ?? []).flatMap((p) => [
        "abono",
        p.description ?? "",
        formatCurrency(p.amount ?? 0),
        dayjs(p.date).locale("es").format("dddd D"),
    ]);

    return [
        loan.lender,
        transaction?.name ?? `Préstamo de ${loan.lender}`,
        "préstamo",                                           // badge modo
        loan.type === "GIVEN" ? "presté" : "recibí",         // badge dirección
        loan.status === "PAID" ? "pagado" : "pendiente",
        formatCurrency(loan.principalAmount),
        formatCurrency(loan.amountPaid),
        formatCurrency(loan.amountRemaining),
        dayjs(loan.startDate).locale("es").format("dddd D"),
        loan.description,
        transaction?.description,
        transaction?.account?.name,
        transaction?.category?.name,
        ...paymentEntries,                                    // entradas de cada abono
    ]
        .filter(Boolean)
        .join(" ");
}