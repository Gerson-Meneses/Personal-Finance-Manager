import { describe, expect, test } from "bun:test";
import {
    extractReceiptAmount,
    extractReceiptItems,
    parseReceiptAmount,
    parseReceiptText,
} from "../src/features/receipts/parser";

const RECEIPT_TEXT = `
PROMART - Homecenters Peruanos S.A.
AV.AVIACION 2405 LIMA LIMA SAN BORJA
RUC 20536557858
FACTURA ELECTRONICA
FA07-02616538
SENOR : HELANORTE SOCIEDAD ANO
DCC IDENTIDAD: RUC 20603715960
D 7757849002940 ABRIGO C/CAPUCHA PLA 2 X 31.90 63.80
D 2000000113128 BOTA SANITARIA PVC T 2 X 27.90 55.80
SUBTOTAL S/ 119.60
4 UNIDAD(ES)
OP. EXONERADA 0.00
OP. INAFECTA 0.00
OP. GRAVADA 101.36
I.G.V. S/ 18.24
IMPORTE TOTAL S/ 119.60
TOTAL A PAGAR S/ 119.60
CIENTO DIECINUEVE Y 60/100 SOLES
CREDITO SIP
4295********0943
ID: 0000629402267858
VUELTO 0.00
Vendedor : ONE PROMART
Nota de Venta : 211019786944
20.10.26 21:50 AC-04
`;

describe("parser de boletas", () => {
    test("extrae total, fecha, establecimiento y dirección", () => {
        const parsed = parseReceiptText(RECEIPT_TEXT);

        expect(parsed.amount).toBe(119.6);
        expect(parsed.date).toBe("2026-10-20");
        expect(parsed.merchantName).toBe("PROMART - Homecenters Peruanos S.A.");
        expect(parsed.merchantAddress).toBe("AV.AVIACION 2405 LIMA LIMA SAN BORJA");
    });

    test("extrae los productos comprados con cantidad y precios", () => {
        const parsed = parseReceiptText(RECEIPT_TEXT);

        expect(parsed.items).toHaveLength(2);
        expect(parsed.items[0]).toEqual({
            name: "ABRIGO C/CAPUCHA PLA",
            quantity: 2,
            unitPrice: 31.9,
            total: 63.8,
        });
        expect(parsed.items[1]).toEqual({
            name: "BOTA SANITARIA PVC T",
            quantity: 2,
            unitPrice: 27.9,
            total: 55.8,
        });
    });

    test("soporta líneas con la palabra total o símbolo de moneda", () => {
        const items = extractReceiptItems([
            "ABRIGO C/CAPUCHA 2 X S/ 31.90 total 63.80",
            "BOTA SANITARIA 2x 27.9 = 55.8",
        ]);

        expect(items).toHaveLength(2);
        expect(items[0].unitPrice).toBe(31.9);
        expect(items[1].total).toBe(55.8);
    });

    test("soporta productos con el nombre y las cantidades en líneas separadas", () => {
        const items = extractReceiptItems([
            "ABRIGO C/CAPUCHA PLA",
            "2 X 31.90 63.80",
            "BOTA SANITARIA PVC T",
            "2 X 27.90 55.80",
        ]);

        expect(items).toHaveLength(2);
        expect(items[0].name).toBe("ABRIGO C/CAPUCHA PLA");
        expect(items[1].name).toBe("BOTA SANITARIA PVC T");
    });

    test("no confunde subtotal ni IGV con el total", () => {
        expect(
            extractReceiptAmount([
                "SUBTOTAL S/ 100.00",
                "I.G.V. S/ 18.00",
                "TOTAL A PAGAR S/ 118.00",
            ])
        ).toBe(118);
    });

    test("parsea montos con coma y miles", () => {
        expect(parseReceiptAmount("S/ 1,234.56")).toBe(1234.56);
        expect(parseReceiptAmount("1.234,56")).toBe(1234.56);
        expect(parseReceiptAmount("25,50")).toBe(25.5);
    });

    test("no devuelve ítems si los números no cuadran", () => {
        const items = extractReceiptItems(["PRODUCTO RARO 2 X 10.00 99.00"]);
        expect(items).toHaveLength(0);
    });
});
