import { describe, expect, test } from "bun:test";
import dayjs from "dayjs";
import { computeBalanceEffect } from "../src/utils/balance";
import { getCreditCardDebt, getMaxBalance } from "../src/utils/getBalanceToCreditCard";
import { calculateLoanPaymentStatus, toLoanResponse } from "../src/mappers/LoansMapper";
import { isTokenVersionValid } from "../src/middlewares/authMiddleware";
import { userWithCredentialsSchema } from "../src/schemas/user.schema";
import { transactionSchema, updateTransactionSchema } from "../src/schemas/transaction.schema";
import { daysInRange } from "../src/services/recurringPaymentService";
import { detectRecurrence } from "../src/services/recurringSuggestionService";
import { roundBudgetSuggestion } from "../src/services/budgetService";
import { buildMonthKeys } from "../src/services/reportsService";
import { LoanMovementType, RecurrenceFrequency, TypeTransaction } from "../src/utils/Enums";
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
                movements: [
                    { type: LoanMovementType.ADVANCE, amount: 100_000 },
                    { type: LoanMovementType.REPAYMENT, amount: 25_000 },
                    { type: LoanMovementType.REPAYMENT, amount: 25_000 },
                ] as any,
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
                movements: [
                    { type: LoanMovementType.ADVANCE, amount: 100 },
                    { type: LoanMovementType.REPAYMENT, amount: 200 },
                ] as any,
            })
        );

        expect(status.totalRemaining).toBe(0);
    });
});

describe("ledger de préstamos", () => {
    test("calcula saldo desde avances, pagos y condonaciones", () => {
        const status = calculateLoanPaymentStatus(
            loan({
                principalAmount: 10_000,
                movements: [
                    { type: LoanMovementType.ADVANCE, amount: 10_000 },
                    { type: LoanMovementType.REPAYMENT, amount: 2_500 },
                    { type: LoanMovementType.FORGIVENESS, amount: 1_000 },
                ] as any,
            })
        );

        expect(status.totalAdvanced).toBe(100);
        expect(status.totalPaid).toBe(25);
        expect(status.totalForgiven).toBe(10);
        expect(status.totalDebt).toBe(90);
        expect(status.totalRemaining).toBe(65);
    });

    test("los ajustes positivos y negativos modifican la deuda", () => {
        const status = calculateLoanPaymentStatus(
            loan({
                principalAmount: 10_000,
                movements: [
                    { type: LoanMovementType.ADVANCE, amount: 10_000 },
                    { type: LoanMovementType.ADJUSTMENT, amount: 2_000 },
                    { type: LoanMovementType.ADJUSTMENT, amount: -1_000 },
                ] as any,
            })
        );

        expect(status.totalRemaining).toBe(110);
    });

    test("una reversión descuenta el pago de las métricas", () => {
        const status = calculateLoanPaymentStatus(
            loan({
                principalAmount: 10_000,
                movements: [
                    { id: "advance", type: LoanMovementType.ADVANCE, amount: 10_000 },
                    { id: "repayment", type: LoanMovementType.REPAYMENT, amount: 2_500 },
                    {
                        id: "reversal",
                        type: LoanMovementType.ADJUSTMENT,
                        amount: 2_500,
                        reversalOfMovementId: "repayment",
                    },
                ] as any,
            })
        );

        expect(status.totalPaid).toBe(0);
        expect(status.totalDebt).toBe(100);
        expect(status.totalRemaining).toBe(100);
        expect(status.percentagePaid).toBe(0);
    });

    test("un avance adicional incrementa la deuda pendiente", () => {
        const status = calculateLoanPaymentStatus(
            loan({
                principalAmount: 10_000,
                movements: [
                    { type: LoanMovementType.ADVANCE, amount: 10_000 },
                    { type: LoanMovementType.ADVANCE, amount: 2_500 },
                ] as any,
            })
        );

        expect(status.totalAdvanced).toBe(125);
        expect(status.totalRemaining).toBe(125);
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

describe("seguridad de registro y sesión", () => {
    const validRegistration = {
        name: "Test User",
        birthDate: "1990-01-01",
        phone: "987654321",
        email: "test@example.com",
        password: "Abcdef1!",
    };

    test("el registro ignora isAdmin enviado por el cliente", () => {
        const parsed = userWithCredentialsSchema.safeParse({
            ...validRegistration,
            isAdmin: true,
        });

        expect(parsed.success).toBe(true);
        if (parsed.success) {
            expect("isAdmin" in parsed.data).toBe(false);
        }
    });

    test("valida la versión del token contra el usuario", () => {
        expect(isTokenVersionValid(0, 0)).toBe(true);
        expect(isTokenVersionValid(undefined, 0)).toBe(true);
        expect(isTokenVersionValid(1, 0)).toBe(false);
        expect(isTokenVersionValid(2, 2)).toBe(true);
    });
});

describe("tipos permitidos en el endpoint genérico de transacciones", () => {
    const base = {
        name: "Movimiento de prueba",
        amount: 10,
        date: "2026-01-01",
        categoryId: "00000000-0000-4000-8000-000000000000",
        accountId: "00000000-0000-4000-8000-000000000000",
        isRecurrent: false,
    };

    test("acepta ingresos y gastos", () => {
        expect(transactionSchema.safeParse({ ...base, type: TypeTransaction.INCOME }).success).toBe(true);
        expect(transactionSchema.safeParse({ ...base, type: TypeTransaction.EXPENSE }).success).toBe(true);
    });

    test("rechaza transferencias y pagos de tarjeta", () => {
        expect(transactionSchema.safeParse({ ...base, type: TypeTransaction.TRANSFER }).success).toBe(false);
        expect(transactionSchema.safeParse({ ...base, type: TypeTransaction.CREDIT_PAYMENT }).success).toBe(false);
    });

    test("el update tampoco permite convertir en transferencia o pago de tarjeta", () => {
        expect(updateTransactionSchema.safeParse({ type: TypeTransaction.TRANSFER }).success).toBe(false);
        expect(updateTransactionSchema.safeParse({ type: TypeTransaction.CREDIT_PAYMENT }).success).toBe(false);
        expect(updateTransactionSchema.safeParse({ type: TypeTransaction.INCOME }).success).toBe(true);
    });
});

describe("deuda de tarjeta de crédito", () => {
    test("calcula la deuda con sobregiro porcentual", () => {
        expect(getCreditCardDebt(100_000, 20, 120_000)).toBe(0);
        expect(getCreditCardDebt(100_000, 20, 100_000)).toBe(20_000);
        expect(getCreditCardDebt(100_000, 0, 50_000)).toBe(50_000);
    });
});

describe("contrato monetario de préstamos", () => {
    test("principalAmount se devuelve en unidades monetarias y en centavos solo si se pide", () => {
        const source = loan({ principalAmount: 100_000, movements: [] });
        const normalized = toLoanResponse(source);
        const cents = toLoanResponse(source, { moneyAmount: false });

        expect(normalized.principalAmount).toBe(1000);
        expect(cents.principalAmount).toBe(100_000);
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

describe("detección de movimientos recurrentes", () => {
    test("detecta un patrón mensual y calcula la próxima fecha", () => {
        const pattern = detectRecurrence(
            ["2026-08-05", "2026-09-05", "2026-10-05", "2026-11-05"],
            [150_000, 150_000, 150_000, 150_000],
            dayjs("2026-11-15")
        );

        expect(pattern).not.toBeNull();
        expect(pattern?.frequency).toBe(RecurrenceFrequency.MONTHLY);
        expect(pattern?.dayOfMonth).toBe(5);
        expect(pattern?.nextDate).toBe("2026-12-05");
        expect(pattern?.confidence).toBeGreaterThan(50);
    });

    test("detecta un patrón cada 15 días", () => {
        const pattern = detectRecurrence(
            ["2026-10-01", "2026-10-16", "2026-10-31", "2026-11-15"],
            [50_000, 50_000, 50_000, 50_000],
            dayjs("2026-11-20")
        );

        expect(pattern?.frequency).toBe(RecurrenceFrequency.FIFTEEN_DAYS);
        expect(pattern?.nextDate).toBe("2026-11-30");
    });

    test("detecta un patrón semanal", () => {
        const pattern = detectRecurrence(
            ["2026-11-02", "2026-11-09", "2026-11-16", "2026-11-23"],
            [2_000, 2_000, 2_000, 2_000],
            dayjs("2026-11-25")
        );

        expect(pattern?.frequency).toBe(RecurrenceFrequency.WEEKLY);
        expect(pattern?.dayOfWeek).toBe(1);
        expect(pattern?.nextDate).toBe("2026-11-30");
    });

    test("descarta movimientos sin intervalos consistentes", () => {
        const pattern = detectRecurrence(
            ["2026-08-01", "2026-08-20", "2026-10-25"],
            [2_000, 2_000, 2_000],
            dayjs("2026-11-01")
        );

        expect(pattern).toBeNull();
    });

    test("descarta patrones que dejaron de repetirse hace tiempo", () => {
        const pattern = detectRecurrence(
            ["2026-01-05", "2026-02-05", "2026-03-05"],
            [2_000, 2_000, 2_000],
            dayjs("2026-11-15")
        );

        expect(pattern).toBeNull();
    });
});

describe("buildMonthKeys", () => {
    test("genera los meses en orden ascendente", () => {
        expect(buildMonthKeys("2026-03", 3)).toEqual([
            "2026-01",
            "2026-02",
            "2026-03",
        ]);
    });

    test("cruza correctamente el cambio de a�o", () => {
        expect(buildMonthKeys("2026-02", 4)).toEqual([
            "2025-11",
            "2025-12",
            "2026-01",
            "2026-02",
        ]);
    });

    test("siempre devuelve al menos un mes", () => {
        expect(buildMonthKeys("2026-07", 0)).toEqual(["2026-07"]);
    });
});
