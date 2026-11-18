import { describe, expect, test } from "bun:test";
import {
    buildBankLines,
    detectMapping,
    parseBankAmount,
    parseBankDate,
    parseCsv,
} from "../src/features/bankImport/utils/csv";

describe("importación CSV bancaria", () => {
    test("detecta delimitador y respeta campos entre comillas", () => {
        const parsed = parseCsv(
            "\uFEFFFecha;Descripción;Monto\n17/11/2026;\"Pago; luz\";-100,50\n"
        );

        expect(parsed.delimiter).toBe(";");
        expect(parsed.rows).toEqual([
            ["Fecha", "Descripción", "Monto"],
            ["17/11/2026", "Pago; luz", "-100,50"],
        ]);
    });

    test("interpreta montos en formatos latinos y negativos", () => {
        expect(parseBankAmount("1.234,56")).toBe(1234.56);
        expect(parseBankAmount("1,234.56")).toBe(1234.56);
        expect(parseBankAmount("S/ 1 234,56")).toBe(1234.56);
        expect(parseBankAmount("-45.90")).toBe(-45.9);
        expect(parseBankAmount("(45,90)")).toBe(-45.9);
        expect(parseBankAmount("")).toBeNull();
    });

    test("interpreta fechas ISO y locales", () => {
        expect(parseBankDate("2026-11-17")).toBe("2026-11-17");
        expect(parseBankDate("17/11/2026")).toBe("2026-11-17");
        expect(parseBankDate("11/17/2026")).toBe("2026-11-17");
        expect(parseBankDate("11/17/2026", "MM/DD/YYYY")).toBe("2026-11-17");
        expect(parseBankDate("31/02/2026")).toBeNull();
    });

    test("detecta columnas y construye movimientos de ingreso y egreso", () => {
        const parsed = parseCsv(
            "Fecha;Descripción;Monto\n17/11/2026;Pago luz;-100,50\n17/11/2026;Cobro;250,00\n"
        );
        const mapping = detectMapping(parsed.rows);

        expect(mapping.hasHeader).toBe(true);
        expect(mapping.amountMode).toBe("single");
        expect(mapping.dateColumn).toBe(0);
        expect(mapping.descriptionColumn).toBe(1);
        expect(mapping.amountColumn).toBe(2);

        const result = buildBankLines(parsed.rows, mapping);
        expect(result.errors).toHaveLength(0);
        expect(result.lines).toHaveLength(2);
        expect(result.lines[0]).toMatchObject({
            date: "2026-11-17",
            description: "Pago luz",
            amount: 100.5,
            type: "EXPENSE",
        });
        expect(result.lines[1]).toMatchObject({
            description: "Cobro",
            amount: 250,
            type: "INCOME",
        });
        expect(result.expenseTotal).toBe(100.5);
        expect(result.incomeTotal).toBe(250);
    });

    test("soporta columnas separadas de débito y crédito", () => {
        const parsed = parseCsv(
            "Fecha;Descripción;Débito;Crédito\n17/11/2026;Pago;100,50;\n17/11/2026;Cobro;;250,00\n"
        );
        const mapping = detectMapping(parsed.rows);

        expect(mapping.amountMode).toBe("debitCredit");
        expect(mapping.debitColumn).toBe(2);
        expect(mapping.creditColumn).toBe(3);

        const result = buildBankLines(parsed.rows, mapping);
        expect(result.errors).toHaveLength(0);
        expect(result.lines.map((line) => line.type)).toEqual(["EXPENSE", "INCOME"]);
    });
});
