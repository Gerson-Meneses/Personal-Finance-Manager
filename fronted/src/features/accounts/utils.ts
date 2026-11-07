import type { Account } from "./types";

/** Límite máximo disponible de una tarjeta de crédito (límite + sobregiro%) */
export const getCreditMax = (account: Account): number =>
    (account.creditLimit ?? 0) * ((account.overdraft ?? 0) / 100 + 1);

/** Deuda actual = máximo disponible - saldo restante */
export const getCreditDebt = (account: Account): number =>
    getCreditMax(account) - account.balance;

/** Porcentaje de uso del límite (0-100) */
export const getCreditUsage = (account: Account): number => {
    if (account.type !== "CREDIT" || !account.creditLimit) return 0;
    return Math.min(Math.round((getCreditDebt(account) / account.creditLimit) * 100), 100);
};
