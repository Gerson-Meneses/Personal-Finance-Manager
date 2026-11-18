import { describe, expect, test } from "bun:test";
import { parseContractText } from "../src/features/creditCards/contractParser";

describe("parser de contrato de tarjeta", () => {
    test("extrae los datos principales del contrato", () => {
        const result = parseContractText(`
            BANCO DE CREDITO DEL PERU
            Contrato de tarjeta de credito Visa Signature
            Titular: JUAN PEREZ GOMEZ
            Linea de credito aprobada: S/ 12,500.00
            Fecha de cierre: 15 de cada mes
            Fecha limite de pago: 05 de cada mes
            TEA: 45.50%
            TCEA: 58.20%
            Seguro de desgravamen: 1.25% mensual
            Tope maximo del seguro: S/ 25.00
            Numero de tarjeta: 4551 1234 5678 9012
        `);

        expect(result.fields.creditLimit).toBe(12500);
        expect(result.fields.billingCloseDay).toBe(15);
        expect(result.fields.paymentDueDay).toBe(5);
        expect(result.fields.tea).toBe(45.5);
        expect(result.fields.tcea).toBe(58.2);
        expect(result.fields.desgravamenRate).toBe(1.25);
        expect(result.fields.desgravamenMaxAmount).toBe(25);
        expect(result.fields.last4).toBe("9012");
        expect(result.fields.issuer).toBe("BCP");
        expect(result.fields.brand).toBe("Visa");
        expect(result.confidence).toBeGreaterThan(70);
    });

    test("tolera montos con separadores locales", () => {
        const result = parseContractText(`
            Limite de credito: S/ 3.500,50
            Dia de cierre: 20
            Dia de pago: 10
        `);

        expect(result.fields.creditLimit).toBe(3500.5);
        expect(result.fields.billingCloseDay).toBe(20);
        expect(result.fields.paymentDueDay).toBe(10);
    });

    test("advierte cuando no encuentra datos", () => {
        const result = parseContractText("Documento sin informacion financiera.");
        expect(result.confidence).toBe(0);
        expect(result.warning).toBeDefined();
    });
});
