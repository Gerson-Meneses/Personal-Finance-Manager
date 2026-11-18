import { extractPdfText } from "../receipts/pdf";
import { recognizeReceiptImage } from "../receipts/ocr";
import { prepareReceiptImage } from "../receipts/utils/prepareReceiptImage";
import type { ReceiptScanProgress } from "../receipts/types";

export interface ContractExtraction {
    creditLimit?: number;
    billingCloseDay?: number;
    paymentDueDay?: number;
    tea?: number;
    tcea?: number;
    desgravamenRate?: number;
    desgravamenMaxAmount?: number;
    last4?: string;
    issuer?: string;
    brand?: string;
    holderName?: string;
}

export interface ContractScanResult {
    text: string;
    fields: ContractExtraction;
    confidence: number;
    warning?: string;
}

const normalize = (value: string) =>
    value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ");

const parseNumber = (value: string): number | undefined => {
    const cleaned = value.replace(/[^\d.,]/g, "");
    if (!cleaned) return undefined;

    const lastComma = cleaned.lastIndexOf(",");
    const lastDot = cleaned.lastIndexOf(".");
    let normalized = cleaned;

    if (lastComma >= 0 && lastDot >= 0) {
        normalized =
            lastComma > lastDot
                ? cleaned.replace(/\./g, "").replace(",", ".")
                : cleaned.replace(/,/g, "");
    } else if (lastComma >= 0) {
        normalized = cleaned.replace(",", ".");
    }

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : undefined;
};

const firstNumber = (text: string, patterns: RegExp[]): number | undefined => {
    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match?.[1]) {
            const value = parseNumber(match[1]);
            if (value !== undefined) return value;
        }
    }
    return undefined;
};

const MONTH_NAMES: Record<string, number> = {
    enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6,
    julio: 7, agosto: 8, septiembre: 9, setiembre: 9, octubre: 10,
    noviembre: 11, diciembre: 12,
};

const findClosingDay = (text: string): number | undefined => {
    const patterns = [
        /fecha de (?:cierre|corte)[^\d]{0,40}(\d{1,2})/i,
        /(?:dia de cierre|d[ií]a de cierre)[^\d]{0,40}(\d{1,2})/i,
        /cierre[^\d]{0,40}(\d{1,2})/i,
    ];
    const value = firstNumber(text, patterns);
    if (value && value >= 1 && value <= 31) return value;

    const monthMatch = text.match(
        /(?:cierre|corte)[^\d]{0,40}(\d{1,2})\s*(?:de\s+)?([a-z]+)/i
    );
    if (monthMatch?.[1] && MONTH_NAMES[monthMatch[2].toLowerCase()]) {
        const day = Number(monthMatch[1]);
        if (day >= 1 && day <= 31) return day;
    }
    return undefined;
};

const findDueDay = (text: string): number | undefined => {
    const patterns = [
        /fecha (?:limite )?de pago[^\d]{0,40}(\d{1,2})/i,
        /(?:dia de pago|d[ií]a de pago|vencimiento)[^\d]{0,40}(\d{1,2})/i,
        /pago[^\d]{0,40}(\d{1,2})\s*(?:de\s+)?([a-z]+)?/i,
    ];
    const value = firstNumber(text, patterns);
    return value && value >= 1 && value <= 31 ? value : undefined;
};

const BANK_NAMES = [
    "BCP", "BBVA", "Interbank", "Scotiabank", "BanBif", "Banco de Crédito",
    "Banco Pichincha", "Mibanco", "Falabella", "Ripley", "Oh!", "Cencosud",
    "Diners Club", "American Express", "Santander", "Itaú",
];

const CARD_BRANDS = ["Visa", "Mastercard", "American Express", "Amex", "Diners Club"];

export const parseContractText = (rawText: string): ContractScanResult => {
    const text = normalize(rawText);
    const fields: ContractExtraction = {};

    const limit = firstNumber(text, [
        /(?:linea de credito|limite de credito|credito aprobado|monto aprobado)[^\d]{0,50}([\d.,]+)/i,
        /(?:S\/|PEN|USD|\$)\s*([\d.,]+)[^\n]{0,30}(?:linea|limite|credito)/i,
    ]);
    if (limit !== undefined) fields.creditLimit = limit;

    fields.billingCloseDay = findClosingDay(text);
    fields.paymentDueDay = findDueDay(text);

    const tea = firstNumber(text, [
        /TEA[^\d%]{0,30}([\d.,]+)\s*%/i,
        /tasa efectiva anual[^\d%]{0,30}([\d.,]+)\s*%/i,
    ]);
    if (tea !== undefined) fields.tea = tea;

    const tcea = firstNumber(text, [
        /TCEA[^\d%]{0,30}([\d.,]+)\s*%/i,
        /tasa de costo efectivo anual[^\d%]{0,30}([\d.,]+)\s*%/i,
    ]);
    if (tcea !== undefined) fields.tcea = tcea;

    const insurance = firstNumber(text, [
        /(?:seguro de )?desgravamen[^\d%]{0,50}([\d.,]+)\s*%/i,
    ]);
    if (insurance !== undefined) fields.desgravamenRate = insurance;

    const insuranceMax = firstNumber(text, [
        /(?:tope|monto maximo|limite maximo)[^\d]{0,50}(?:S\/|PEN|USD|\$)?\s*([\d.,]+)/i,
        /desgravamen[^\n]{0,80}(?:S\/|PEN|USD|\$)\s*([\d.,]+)/i,
    ]);
    if (insuranceMax !== undefined) fields.desgravamenMaxAmount = insuranceMax;

    const cardNumber = text.match(/\b(?:\d[ -]?){12}(\d{4})\b/);
    if (cardNumber?.[1]) fields.last4 = cardNumber[1];

    if (text.toLowerCase().includes("banco de credito")) {
        fields.issuer = "BCP";
    } else {
        const issuer = BANK_NAMES.find((name) =>
            text.toLowerCase().includes(normalize(name).toLowerCase())
        );
        if (issuer) fields.issuer = issuer;
    }

    const brand = CARD_BRANDS.find((name) => text.toLowerCase().includes(name.toLowerCase()));
    if (brand) fields.brand = brand;

    const holder = text.match(/(?:titular|nombre del titular)[:\s]+([A-Za-zÁÉÍÓÚÑáéíóúñ ]{5,80})/i);
    if (holder?.[1]) fields.holderName = holder[1].trim();

    const found = Object.values(fields).filter((value) => value !== undefined).length;
    const confidence = Math.round((found / 10) * 100);

    return {
        text,
        fields,
        confidence,
        ...(found === 0
            ? { warning: "No se detectaron datos del contrato. Puedes completarlos manualmente." }
            : {}),
    };
};

const isPdf = (file: File) =>
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

export const scanContractFile = async (
    file: File,
    onProgress?: (progress: ReceiptScanProgress) => void
): Promise<{ result: ContractScanResult; file: File }> => {
    if (isPdf(file)) {
        onProgress?.({ status: "Leyendo PDF", progress: 10 });
        const { text, pageImage } = await extractPdfText(file);

        if (text.replace(/\s/g, "").length >= 20) {
            onProgress?.({ status: "Extrayendo datos", progress: 90 });
            return { result: parseContractText(text), file };
        }

        if (!pageImage) {
            return {
                result: {
                    ...parseContractText(text),
                    confidence: 0,
                    warning: "El PDF no contiene texto legible.",
                },
                file,
            };
        }

        const ocr = await recognizeReceiptImage(pageImage, onProgress);
        return { result: parseContractText(ocr.text), file };
    }

    const prepared = await prepareReceiptImage(file);
    const ocr = await recognizeReceiptImage(prepared, onProgress);
    return { result: parseContractText(ocr.text), file: prepared };
};
