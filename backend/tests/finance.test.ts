import { describe, expect, test } from "bun:test";
import { computeBalanceEffect } from "../src/utils/balance";
import { getMaxBalance } from "../src/utils/getBalanceToCreditCard";
import { calculateLoanPaymentStatus } from "../src/mappers/LoansMapper";
import { daysInRange } from "../src/services/recurringPaymentService";
import { roundBudgetSuggestion } from "../src/services/budgetService";
import { RecurrenceFrequency, TypeTransaction } from "../src/utils/Enums";
import type { RecurringPayment } from "../src/entities/RecurringPayment.entity";
import type { Loan } from "../src/entities/Loan.entity";

const payment = (overrides: Partial<RecurringPayment>): RecurringPayment =>
    ({
        startDate: "2026-01-01",
        frequency: RecurrenceFrequency.MONTHLY,
        intervalCount: 1,
        endDate: null,
        ...overrides,
    }) as RecurringPayment;

const loan = (overrides: Partial<Loan>): Loan =>
    ({
        principalAmount: 100_000,
        payments: [],
        ...overrides,
    }) as Loan;

describe("computeBalanceEffect", () => {
    test("suma ingresos y resta gastos", () => {
        expect(
            computeBalanceEffect({
                type: TypeTransaction.INCOME,
                amount: 5000,
                account: { id: "a" },
            }).get("a")
        ).toBe(5000);

        expect(
            computeBalanceEffect({
                type: TypeTransaction.EXPENSE,
                amount: 2000,
                account: { id: "a" },
            }).get("a")
        ).toBe(-2000);
    });

    test("mueve saldo entre cuentas en transferencias", () => {
        const effect = computeBalanceEffect({
            type: TypeTransaction.TRANSFER,
            amount: 1500,
            account: { id: "origen" },
            relatedAccount: { id: "destino" },
        });

        expect(effect.get("origen")).toBe(-1500);
        expect(effect.get("destino")).toBe(1500);
    });

    test("ignora la cuenta relacionada si no existe", () => {
        const effect = computeBalanceEffect({
            type: TypeTransaction.CREDIT_PAYMENT,
            amount: 900,
            account: { id: "cuenta" },
            relatedAccount: null,
        });

        expect(effect.get("cuenta")).toBe(-900);
        expect(effect.size).toBe(1);
    });
});

describe("getMaxBalance", () => {
    test("incluye sobregiro y redondea", () => {
        expect(getMaxBalance(100_000, 0)).toBe(100_000);
        expect(getMaxBalance(100_000, 20)).toBe(120_000);
        expect(getMaxBalance(100_001, 11)).toBe(111_001);
    });
});

describe("calculateLoanPaymentStatus", () => {
    test("calcula pagado, pendiente y porcentaje", () => {
        const status = calculateLoanPaymentStatus(
            loan({
                principalAmount: 100_000,
                payments: [{ amount: 25_000 }, { amount: 25_000 }] as any,
            })
        );

        expect(status.totalPaid).toBe(500);
        expect(status.totalRemaining).toBe(500);
        expect(status.percentagePaid).toBe(50);
    });

    test("nunca deja pendiente negativo", () => {
        const status = calculateLoanPaymentStatus(
            loan({
                principalAmount: 100,
                payments: [{ amount: 200 }] as any,
            })
        );

        expect(status.totalRemaining).toBe(0);
    });
});

describe("recurrencia de pagos", () => {
    test("mensual: ajusta el día 31 al último día del mes", () => {
        const dates = daysInRange(
            payment({ dayOfMonth: 31, startDate: "2026-01-01" }),
            "2026-02-01",
            "2026-02-28"
        );

        expect(dates).toEqual(["2026-02-28"]);
    });

    test("mensual: no genera una fecha anterior al inicio", () => {
        const dates = daysInRange(
            payment({ dayOfMonth: 5, startDate: "2026-01-10" }),
            "2026-01-01",
            "2026-02-28"
        );

        expect(dates).toEqual(["2026-02-05"]);
    });

    test("semanal: genera todos los lunes del rango", () => {
        const dates = daysInRange(
            payment({
                frequency: RecurrenceFrequency.WEEKLY,
                dayOfWeek: 1,
                startDate: "2026-11-01",
            }),
            "2026-11-01",
            "2026-11-30"
        );

        expect(dates).toEqual([
            "2026-11-02",
            "2026-11-09",
            "2026-11-16",
            "2026-11-23",
            "2026-11-30",
        ]);
    });

    test("quincenal: respeta el intervalo de dos semanas", () => {
        const dates = daysInRange(
            payment({
                frequency: RecurrenceFrequency.BIWEEKLY,
                dayOfWeek: 1,
                startDate: "2026-11-01",
            }),
            "2026-11-01",
            "2026-12-31"
        );

        expect(dates).toEqual([
            "2026-11-02",
            "2026-11-16",
            "2026-11-30",
            "2026-12-14",
            "2026-12-28",
        ]);
    });

    test("anual: ajusta 29 de febrero en años no bisiestos", () => {
        const dates = daysInRange(
            payment({
                frequency: RecurrenceFrequency.YEARLY,
                startDate: "2024-02-29",
            }),
            "2025-01-01",
            "2025-12-31"
        );

        expect(dates).toEqual(["2025-02-28"]);
    });

    test("único: genera solo la fecha de inicio dentro del rango", () => {
        const dates = daysInRange(
            payment({
                frequency: RecurrenceFrequency.ONCE,
                startDate: "2026-11-20",
            }),
            "2026-11-01",
            "2026-11-30"
        );

        expect(dates).toEqual(["2026-11-20"]);
    });

    test("único: no se repite en meses posteriores", () => {
        const dates = daysInRange(
            payment({
                frequency: RecurrenceFrequency.ONCE,
                startDate: "2026-11-20",
            }),
            "2026-12-01",
            "2026-12-31"
        );

        expect(dates).toEqual([]);
    });

    test("cada 15 días: genera fechas exactas de 15 días", () => {
        const dates = daysInRange(
            payment({
                frequency: RecurrenceFrequency.FIFTEEN_DAYS,
                startDate: "2026-11-01",
            }),
            "2026-11-01",
            "2026-12-31"
        );

        expect(dates).toEqual([
            "2026-11-01",
            "2026-11-16",
            "2026-12-01",
            "2026-12-16",
            "2026-12-31",
        ]);
    });

    test("límite por número de repeticiones: corta el cronograma", () => {
        const dates = daysInRange(
            payment({
                frequency: RecurrenceFrequency.BIWEEKLY,
                dayOfWeek: 1,
                startDate: "2026-11-02",
                maxOccurrences: 3,
            }),
            "2026-11-01",
            "2026-12-31"
        );

        expect(dates).toEqual(["2026-11-02", "2026-11-16", "2026-11-30"]);
    });

    test("el límite cuenta ocurrencias anteriores al rango consultado", () => {
        const dates = daysInRange(
            payment({
                frequency: RecurrenceFrequency.MONTHLY,
                dayOfMonth: 5,
                startDate: "2026-01-01",
                maxOccurrences: 2,
            }),
            "2026-03-01",
            "2026-12-31"
        );

        expect(dates).toEqual([]);
    });

    test("respeta la fecha de fin", () => {
        const dates = daysInRange(
            payment({ dayOfMonth: 5, startDate: "2026-01-01", endDate: "2026-03-31" }),
            "2026-01-01",
            "2026-12-31"
        );

        expect(dates).toEqual(["2026-01-05", "2026-02-05", "2026-03-05"]);
    });

    test("devuelve vacío si el rango está fuera de la regla", () => {
        const dates = daysInRange(
            payment({ startDate: "2026-06-01" }),
            "2026-01-01",
            "2026-05-31"
        );

        expect(dates).toEqual([]);
    });
});

describe("sugerencias de presupuesto", () => {
    test("redondea hacia arriba en pasos de 5 unidades", () => {
        expect(roundBudgetSuggestion(0)).toBe(0);
        expect(roundBudgetSuggestion(1)).toBe(500);
        expect(roundBudgetSuggestion(501)).toBe(1000);
        expect(roundBudgetSuggestion(12_345)).toBe(12_500);
    });
});
