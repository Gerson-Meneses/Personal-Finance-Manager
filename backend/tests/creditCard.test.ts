import { describe, expect, test } from "bun:test";
import {
    allocatePaymentsToBilledItems,
    buildInstallmentSchedule,
    closingDateForPurchase,
    dueDateForClosing,
    monthlyRateFromTea,
    nextDueDate,
} from "../src/utils/creditCard";

describe("ciclos de tarjeta de credito", () => {
    test("asigna una compra antes del cierre al cierre de ese mes", () => {
        expect(closingDateForPurchase("2026-11-10", 15)).toBe("2026-11-15");
    });

    test("asigna una compra despues del cierre al siguiente mes", () => {
        expect(closingDateForPurchase("2026-11-20", 15)).toBe("2026-12-15");
    });

    test("calcula el vencimiento en el mismo mes si el dia de pago es posterior", () => {
        expect(dueDateForClosing("2026-11-15", 25)).toBe("2026-11-25");
    });

    test("calcula el vencimiento al mes siguiente si el dia de pago es anterior", () => {
        expect(dueDateForClosing("2026-11-15", 5)).toBe("2026-12-05");
    });

    test("primera fecha de pago es posterior a hoy", () => {
        expect(nextDueDate("2026-11-10", 15, 5)).toBe("2026-12-05");
    });

    test("convierte TEA a tasa mensual efectiva", () => {
        const monthly = monthlyRateFromTea(24);
        expect(monthly).toBeGreaterThan(0.018);
        expect(monthly).toBeLessThan(0.019);
    });
});

describe("imputación de pagos de tarjeta", () => {
    test("no aplica un pago a deuda que aún no estaba facturada", () => {
        const items = [
            { amount: 10_000, paid: 0, closingDate: "2026-11-28" },
            { amount: 12_000, paid: 0, closingDate: "2026-11-28" },
        ];

        allocatePaymentsToBilledItems(items, [{ amount: 20_000, date: "2026-11-06" }]);

        expect(items.map((item) => item.paid)).toEqual([0, 0]);
    });

    test("aplica pagos solo a deuda ya cerrada, de la más antigua a la más nueva", () => {
        const items = [
            { amount: 10_000, paid: 0, closingDate: "2026-10-28" },
            { amount: 12_000, paid: 0, closingDate: "2026-11-28" },
        ];

        allocatePaymentsToBilledItems(items, [{ amount: 15_000, date: "2026-11-06" }]);

        expect(items[0].paid).toBe(10_000);
        expect(items[1].paid).toBe(0);
    });

    test("ignora el excedente cuando el pago supera la deuda facturada", () => {
        const items = [
            { amount: 10_000, paid: 0, closingDate: "2026-10-28" },
            { amount: 12_000, paid: 0, closingDate: "2026-11-28" },
        ];

        allocatePaymentsToBilledItems(items, [{ amount: 50_000, date: "2026-11-06" }]);

        expect(items[0].paid).toBe(10_000);
        expect(items[1].paid).toBe(0);
    });
});

describe("cronograma de cuotas", () => {
    test("reparte todo el principal y agrega interes", () => {
        const schedule = buildInstallmentSchedule({
            principal: 100_000,
            installmentsCount: 6,
            teaPercent: 24,
            firstDueDate: "2026-12-05",
            closeDay: 15,
        });

        expect(schedule.rows).toHaveLength(6);
        expect(schedule.rows.reduce((sum, row) => sum + row.principal, 0)).toBe(100_000);
        expect(schedule.totalInterest).toBeGreaterThan(0);
        expect(schedule.totalAmount).toBe(100_000 + schedule.totalInterest);
    });

    test("sin TEA no genera interes", () => {
        const schedule = buildInstallmentSchedule({
            principal: 90_000,
            installmentsCount: 3,
            teaPercent: 0,
            firstDueDate: "2026-12-05",
            closeDay: 15,
        });

        expect(schedule.totalInterest).toBe(0);
        expect(schedule.rows.map((row) => row.principal)).toEqual([30_000, 30_000, 30_000]);
        expect(schedule.rows.map((row) => row.total)).toEqual([30_000, 30_000, 30_000]);
    });

    test("mantiene el dia de vencimiento entre meses", () => {
        const schedule = buildInstallmentSchedule({
            principal: 30_000,
            installmentsCount: 3,
            teaPercent: 0,
            firstDueDate: "2027-01-31",
            closeDay: 15,
        });

        expect(schedule.rows[0].dueDate).toBe("2027-01-31");
        expect(schedule.rows[1].dueDate).toBe("2027-02-28");
        expect(schedule.rows[2].dueDate).toBe("2027-03-31");
    });
});
