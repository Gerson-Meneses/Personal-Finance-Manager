export interface ParsedReceiptItem {
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
}

export interface ParsedReceipt {
    text: string;
    amount: number | null;
    date: string | null;
    merchantName: string | null;
    merchantAddress: string | null;
    merchantRuc: string | null;
    items: ParsedReceiptItem[];
}

const AMOUNT_TOKEN = /(?:S\/\.?|PEN|USD|\$)?\s*(\d{1,3}(?:[.,\s]\d{3})*(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?)/gi;

const AMOUNT_AFTER_KEYWORD =
    /(?:total(?:\s+a\s+pagar|\s+general)?|importe\s+total|monto\s+total|importe|a\s+pagar)[^\d]{0,25}(\d{1,3}(?:[.,\s]\d{3})*(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?)/i;

const STRONG_TOTAL_KEYWORDS = [
    "total a pagar",
    "importe total",
    "monto total",
    "total general",
    "total",
];

const WEAK_TOTAL_KEYWORDS = ["importe", "a pagar"];

const EXCLUDED_TOTAL_LINES = [
    "subtotal",
    "sub total",
    "igv",
    "i.g.v",
    "impuesto",
    "descuento",
    "dscto",
    "vuelto",
    "cambio",
    "recibido",
    "efectivo",
    "tarjeta",
    "propina",
    "gravada",
    "exonerada",
    "inafecta",
    "op. gravada",
    "operacion gravada",
];

const NAME_EXCLUDED = [
    "boleta",
    "factura",
    "ticket",
    "comprobante",
    "ruc",
    "dni",
    "fecha",
    "hora",
    "caja",
    "serie",
    "correlativo",
    "vendedor",
    "cliente",
    "direccion",
    "telefono",
    "total",
    "subtotal",
    "igv",
    "pago",
    "efectivo",
    "tarjeta",
    "electronica",
    "electronico",
];

const ITEM_EXCLUDED = [
    ...EXCLUDED_TOTAL_LINES,
    "autorizado",
    "resolucion",
    "nota de venta",
    "vendedor",
    "credito",
    "unidad",
    "soles",
    "caja",
    "cliente",
    "documento",
    "identidad",
    "senor",
    "sr",
    "dni",
    "fecha",
    "hora",
    "id:",
    "ruc",
];

const ADDRESS_KEYWORDS = [
    "av.",
    "av ",
    "avenida",
    "jr.",
    "jr ",
    "jiron",
    "cal.",
    "calle",
    "pasaje",
    "psj.",
    "urb.",
    "urbanizacion",
    "mz.",
    "lt.",
    "centro comercial",
    "cc.",
];

const MONTHS: Record<string, number> = {
    ene: 1,
    enero: 1,
    feb: 2,
    febrero: 2,
    mar: 3,
    marzo: 3,
    abr: 4,
    abril: 4,
    may: 5,
    mayo: 5,
    jun: 6,
    junio: 6,
    jul: 7,
    julio: 7,
    ago: 8,
    agosto: 8,
    sep: 9,
    sept: 9,
    septiembre: 9,
    oct: 10,
    octubre: 10,
    nov: 11,
    noviembre: 11,
    dic: 12,
    diciembre: 12,
};

const normalizeForMatch = (value: string) =>
    value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();

const cleanText = (value: string, allowed: RegExp) =>
    value
        .replace(allowed, " ")
        .replace(/\s+/g, " ")
        .trim();

export const parseReceiptAmount = (raw: string): number | null => {
    const cleaned = raw
        .replace(/(?:S\/\.?|PEN|USD|\$)/gi, "")
        .replace(/\s/g, "");

    if (!cleaned || !/\d/.test(cleaned)) return null;

    const lastComma = cleaned.lastIndexOf(",");
    const lastDot = cleaned.lastIndexOf(".");

    let normalized = cleaned;

    if (lastComma >= 0 && lastDot >= 0) {
        const decimalSeparator = lastComma > lastDot ? "," : ".";
        const thousandsSeparator = decimalSeparator === "," ? "." : ",";
        normalized = cleaned
            .split(thousandsSeparator)
            .join("")
            .replace(decimalSeparator, ".");
    } else if (lastComma >= 0) {
        const decimals = cleaned.length - lastComma - 1;
        normalized = decimals <= 2 ? cleaned.replace(",", ".") : cleaned.replace(/,/g, "");
    } else if (lastDot >= 0) {
        const decimals = cleaned.length - lastDot - 1;
        if (decimals > 2) normalized = cleaned.replace(/\./g, "");
    }

    const value = Number(normalized);
    if (!Number.isFinite(value) || value <= 0 || value >= 1_000_000_000) return null;

    return Math.round(value * 100) / 100;
};

const extractAmounts = (line: string): number[] => {
    const values: number[] = [];
    for (const match of line.matchAll(AMOUNT_TOKEN)) {
        const value = parseReceiptAmount(match[1] ?? match[0]);
        if (value !== null) values.push(value);
    }
    return values;
};

export const extractReceiptAmount = (lines: string[]): number | null => {
    let best: { amount: number; score: number; index: number } | null = null;

    for (let index = 0; index < lines.length; index += 1) {
        const line = lines[index];
        const normalized = normalizeForMatch(line);
        if (!normalized.trim()) continue;
        if (EXCLUDED_TOTAL_LINES.some((keyword) => normalized.includes(keyword))) continue;

        let score = 0;
        if (STRONG_TOTAL_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
            score = 3;
        } else if (WEAK_TOTAL_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
            score = 2;
        }
        if (score === 0) continue;

        let amounts = extractAmounts(line);

        if (amounts.length === 0 && lines[index + 1]) {
            const nextNormalized = normalizeForMatch(lines[index + 1]);
            const nextIsExcluded = EXCLUDED_TOTAL_LINES.some((keyword) =>
                nextNormalized.includes(keyword)
            );
            if (!nextIsExcluded) amounts = extractAmounts(lines[index + 1]);
        }

        if (amounts.length === 0) continue;

        const afterKeyword = line.match(AMOUNT_AFTER_KEYWORD);
        const keywordAmount = afterKeyword
            ? parseReceiptAmount(afterKeyword[1])
            : null;

        const amount = keywordAmount ?? amounts[amounts.length - 1];

        if (
            !best ||
            score > best.score ||
            (score === best.score && index > best.index)
        ) {
            best = { amount, score, index };
        }
    }

    return best?.amount ?? null;
};

const toIsoDate = (year: number, month: number, day: number): string | null => {
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    if (year < 2000 || year > 2100) return null;

    const date = new Date(Date.UTC(year, month - 1, day));
    if (
        date.getUTCFullYear() !== year ||
        date.getUTCMonth() !== month - 1 ||
        date.getUTCDate() !== day
    ) {
        return null;
    }

    return date.toISOString().slice(0, 10);
};

const normalizeYear = (year: number) =>
    year < 100 ? (year >= 70 ? 1900 + year : 2000 + year) : year;

export const extractDateFromLine = (line: string): string | null => {
    const ymd = line.match(/\b(\d{4})[/.-](\d{1,2})[/.-](\d{1,2})\b/);
    if (ymd) {
        const date = toIsoDate(Number(ymd[1]), Number(ymd[2]), Number(ymd[3]));
        if (date) return date;
    }

    const dmy = line.match(/\b(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})\b/);
    if (dmy) {
        const date = toIsoDate(
            normalizeYear(Number(dmy[3])),
            Number(dmy[2]),
            Number(dmy[1])
        );
        if (date) return date;
    }

    const named = line.match(/\b(\d{1,2})\s*(?:de\s*)?([a-záéíóúñ]{3,})\.?\s*(?:de\s*)?(\d{2,4})\b/i);
    if (named) {
        const month = MONTHS[normalizeForMatch(named[2])];
        if (month) {
            const date = toIsoDate(
                normalizeYear(Number(named[3])),
                month,
                Number(named[1])
            );
            if (date) return date;
        }
    }

    return null;
};

export const extractReceiptDate = (lines: string[]): string | null => {
    let best: { date: string; score: number } | null = null;

    for (const line of lines) {
        const date = extractDateFromLine(line);
        if (!date) continue;

        const normalized = normalizeForMatch(line);
        const score = /fecha|emision/.test(normalized) ? 2 : 1;

        if (!best || score > best.score) best = { date, score };
    }

    return best?.date ?? null;
};

const cleanMerchantName = (raw: string): string | null => {
        const value = cleanText(raw, /[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s',.-]/g)
        .replace(/^[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]+/, "")
        .slice(0, 99)
        .trim();

    if (value.length < 3) return null;
    if (!/[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(value)) return null;

    const letters = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ]/g, "").length;
    if (letters / value.length < 0.5) return null;

    return value;
};

export const extractReceiptMerchantName = (lines: string[]): string | null => {
    for (const rawLine of lines.slice(0, 12)) {
        const line = rawLine.trim();
        if (!line) continue;

        const normalized = normalizeForMatch(line);
        if (NAME_EXCLUDED.some((keyword) => normalized.startsWith(keyword))) continue;
        if (ADDRESS_KEYWORDS.some((keyword) => normalized.startsWith(keyword))) continue;
        if (/\b\d{8,}\b/.test(line)) continue;

        const labelled = line.match(
            /(?:raz[oó]n\s+social|nombre|empresa|comercio|negocio)\s*[:-]\s*(.+)/i
        );

        const candidate = cleanMerchantName(labelled?.[1] ?? line);
        if (candidate) return candidate;
    }

    return null;
};

export const extractReceiptAddress = (lines: string[]): string | null => {
    for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line) continue;

        const normalized = normalizeForMatch(line);
        if (/(ruc|dni|fecha|hora|total|boleta|factura|correlativo)/.test(normalized)) {
            continue;
        }

        const looksLikeAddress =
            ADDRESS_KEYWORDS.some((keyword) => normalized.startsWith(keyword)) ||
            /\b(av|avenida|calle|jiron|pasaje|urbanizacion|san borja|lima)\b/.test(normalized);

        if (!looksLikeAddress) continue;

        const candidate = cleanText(line, /[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s',.#/-]/g)
            .slice(0, 255)
            .trim();

        if (candidate.length >= 5) return candidate;
    }

    return null;
};

export const extractReceiptRuc = (text: string): string | null => {
    const labelled = text.match(/\bRUC\b[^\d]{0,12}(\d{11})\b/i);
    if (labelled) return labelled[1];

    const inline = text.match(/\b(?:10|15|17|20)\d{9}\b/);
    return inline?.[0] ?? null;
};

const ITEM_NUMBERS =
    /(?<qty>\d{1,4}(?:[.,]\d{1,3})?)\s*[xX×*]\s*(?:S\/\.?)?\s*(?<unit>\d{1,7}(?:[.,]\d{1,2})?)\s+(?:total\s*)?(?:S\/\.?)?\s*[=:]?\s*(?<total>\d{1,9}(?:[.,]\d{1,2})?)/;

const ITEM_CODE_PREFIX = /^(?:[A-Z]\s+)?(?:\d{6,}\s+)?/i;

const isExcludedItemLine = (line: string) => {
    const normalized = normalizeForMatch(line);
    return ITEM_EXCLUDED.some((keyword) => normalized.includes(keyword));
};

const looksLikeProductName = (line: string) => {
    const value = line.trim();
    if (value.length < 2) return false;
    if (isExcludedItemLine(value)) return false;
    if (!/[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(value)) return false;
    if (ITEM_NUMBERS.test(value)) return false;
    return true;
};

const cleanItemName = (raw: string): string | null => {
    const withoutCode = raw.replace(ITEM_CODE_PREFIX, "");
    const value = cleanText(withoutCode, /[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s',./-]/g)
        .slice(0, 255)
        .trim();

    if (value.length < 2) return null;
    if (!/[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(value)) return null;
    return value;
};

const buildItem = (
    name: string | null,
    numbersLine: string
): ParsedReceiptItem | null => {
    if (!name) return null;
    const match = numbersLine.match(ITEM_NUMBERS);
    if (!match?.groups) return null;

    const quantity = Number((match.groups.qty ?? "").replace(",", "."));
    const unitPrice = parseReceiptAmount(match.groups.unit ?? "");
    const total = parseReceiptAmount(match.groups.total ?? "");

    if (!Number.isFinite(quantity) || quantity <= 0) return null;
    if (unitPrice === null || total === null) return null;

    const expected = quantity * unitPrice;
    const tolerance = Math.max(0.05, total * 0.02);
    if (Math.abs(expected - total) > tolerance) return null;

    const cleanName = cleanItemName(name);
    if (!cleanName) return null;

    return {
        name: cleanName,
        quantity,
        unitPrice,
        total,
    };
};

export const extractReceiptItems = (lines: string[]): ParsedReceiptItem[] => {
    const items: ParsedReceiptItem[] = [];
    const consumed = new Set<number>();

    for (let index = 0; index < lines.length; index += 1) {
        if (consumed.has(index)) continue;

        const line = lines[index];
        if (isExcludedItemLine(line)) continue;

        const sameLine = line.match(ITEM_NUMBERS);
        if (sameLine) {
            const namePart = line.slice(0, sameLine.index ?? 0);
            const item = buildItem(namePart, line);
            if (item) items.push(item);
            continue;
        }

        // OCR a veces separa el nombre del producto y la línea de cantidades.
        const next = lines[index + 1];
        if (
            next &&
            !consumed.has(index + 1) &&
            looksLikeProductName(line) &&
            ITEM_NUMBERS.test(next) &&
            !isExcludedItemLine(next)
        ) {
            const item = buildItem(line, next);
            if (item) {
                items.push(item);
                consumed.add(index + 1);
            }
        }
    }

    return items;
};

export const parseReceiptText = (text: string): ParsedReceipt => {
    const lines = text
        .replace(/\r/g, "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

    return {
        text: text.trim(),
        amount: extractReceiptAmount(lines),
        date: extractReceiptDate(lines),
        merchantName: extractReceiptMerchantName(lines),
        merchantAddress: extractReceiptAddress(lines),
        merchantRuc: extractReceiptRuc(text),
        items: extractReceiptItems(lines),
    };
};
