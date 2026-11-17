import dayjs from "dayjs";
import type { ImportBankLineInput } from "../types";

export type AmountMode = "single" | "debitCredit";
export type DateFormat = "auto" | "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD";

export interface ColumnMapping {
    hasHeader: boolean;
    dateColumn: number;
    descriptionColumn: number;
    amountMode: AmountMode;
    amountColumn: number;
    debitColumn: number;
    creditColumn: number;
    dateFormat: DateFormat;
}

export interface ParsedCsv {
    rows: string[][];
    delimiter: string;
}

export interface LineParseError {
    rowNumber: number;
    message: string;
    raw: string;
}

export interface BuildLinesResult {
    lines: ImportBankLineInput[];
    errors: LineParseError[];
    incomeTotal: number;
    expenseTotal: number;
}

const normalizeHeader = (value: string) =>
    value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();

const detectDelimiter = (text: string) => {
    const firstLine = text.split(/\r?\n/).find((line) => line.trim()) ?? "";
    const counts = [
        { delimiter: ";", count: (firstLine.match(/;/g) ?? []).length },
        { delimiter: "\t", count: (firstLine.match(/\t/g) ?? []).length },
        { delimiter: ",", count: (firstLine.match(/,/g) ?? []).length },
    ];

    counts.sort((a, b) => b.count - a.count);
    return counts[0].count > 0 ? counts[0].delimiter : ";";
};

export const parseCsv = (text: string): ParsedCsv => {
    const clean = text.replace(/^\uFEFF/, "");
    const delimiter = detectDelimiter(clean);
    const rows: string[][] = [];
    let row: string[] = [];
    let field = "";
    let inQuotes = false;

    for (let index = 0; index < clean.length; index += 1) {
        const char = clean[index];

        if (inQuotes) {
            if (char === '"') {
                if (clean[index + 1] === '"') {
                    field += '"';
                    index += 1;
                } else {
                    inQuotes = false;
                }
            } else {
                field += char;
            }
            continue;
        }

        if (char === '"') {
            inQuotes = true;
        } else if (char === delimiter) {
            row.push(field.trim());
            field = "";
        } else if (char === "\n") {
            row.push(field.trim());
            rows.push(row);
            row = [];
            field = "";
        } else if (char !== "\r") {
            field += char;
        }
    }

    if (field.length > 0 || row.length > 0) {
        row.push(field.trim());
        rows.push(row);
    }

    return {
        delimiter,
        rows: rows.filter((cells) => cells.some((cell) => cell.length > 0)),
    };
};

/**
 * Interpreta montos bancarios: `1.234,56`, `1,234.56`, `-45.90`,
 * `(45,90)`, `S/ 1 234,56`, etc. Devuelve número en pesos o null.
 */
export const parseBankAmount = (raw: string): number | null => {
    const original = raw.trim();
    if (!original) return null;

    const negative =
        /^\(.*\)$/.test(original) ||
        original.includes("-") ||
        /\bDB\b/i.test(original);

    let normalized = original.replace(/[^\d.,]/g, "");
    if (!normalized) return null;

    const lastComma = normalized.lastIndexOf(",");
    const lastDot = normalized.lastIndexOf(".");

    if (lastComma >= 0 && lastDot >= 0) {
        if (lastComma > lastDot) {
            normalized = normalized.replace(/\./g, "").replace(/,/g, ".");
        } else {
            normalized = normalized.replace(/,/g, "");
        }
    } else if (lastComma >= 0) {
        const parts = normalized.split(",");
        if (parts.length === 2 && parts[1].length > 0 && parts[1].length <= 2) {
            normalized = normalized.replace(",", ".");
        } else {
            normalized = normalized.replace(/,/g, "");
        }
    } else if (lastDot >= 0) {
        const parts = normalized.split(".");
        if (parts.length > 2) {
            const decimals = parts[parts.length - 1];
            if (decimals.length <= 2) {
                const last = parts.pop() ?? "0";
                normalized = `${parts.join("")}.${last}`;
            } else {
                normalized = normalized.replace(/\./g, "");
            }
        } else if (
            parts.length === 2 &&
            parts[1].length === 3 &&
            parts[0].length <= 3
        ) {
            normalized = normalized.replace(/\./g, "");
        }
    }

    const value = Number(normalized);
    if (!Number.isFinite(value)) return null;

    return negative ? -Math.abs(value) : value;
};

const pad = (value: number) => String(value).padStart(2, "0");

export const parseBankDate = (
    raw: string,
    format: DateFormat = "auto"
): string | null => {
    const value = raw.trim().split(/\s+/)[0];
    if (!value) return null;

    const iso = value.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
    if (iso) {
        const [, year, month, day] = iso;
        return validateDate(Number(year), Number(month), Number(day));
    }

    const dmy = value.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/);
    if (!dmy) return null;

    const first = Number(dmy[1]);
    const second = Number(dmy[2]);
    const year = dmy[3].length === 2 ? 2000 + Number(dmy[3]) : Number(dmy[3]);

    let day: number;
    let month: number;

    if (format === "MM/DD/YYYY") {
        month = first;
        day = second;
    } else if (format === "DD/MM/YYYY") {
        day = first;
        month = second;
    } else if (first > 12) {
        day = first;
        month = second;
    } else if (second > 12) {
        month = first;
        day = second;
    } else {
        day = first;
        month = second;
    }

    return validateDate(year, month, day);
};

const validateDate = (year: number, month: number, day: number) => {
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    const candidate = dayjs(`${year}-${pad(month)}-${pad(day)}`);
    if (!candidate.isValid()) return null;
    const normalized = `${year}-${pad(month)}-${pad(day)}`;
    return candidate.format("YYYY-MM-DD") === normalized ? normalized : null;
};

const findColumn = (
    headers: string[],
    patterns: RegExp[],
    exclude: RegExp[] = []
) =>
    headers.findIndex((header) => {
        const normalized = normalizeHeader(header);
        if (exclude.some((pattern) => pattern.test(normalized))) return false;
        return patterns.some((pattern) => pattern.test(normalized));
    });

export const detectMapping = (rows: string[][]): ColumnMapping => {
    const firstRow = rows[0] ?? [];
    const hasHeader =
        firstRow.length > 0 &&
        firstRow.every((cell) => {
            const value = cell.trim();
            return (
                !value ||
                (parseBankDate(value) === null &&
                    parseBankAmount(value) === null)
            );
        });

    const headers = hasHeader ? firstRow : [];
    const dateColumn = hasHeader
        ? findColumn(headers, [/fecha/, /date/, /f\.?oper/, /operacion/, /valor/])
        : 0;
    const descriptionColumn = hasHeader
        ? findColumn(headers, [
            /descrip/,
            /concepto/,
            /detalle/,
            /glosa/,
            /beneficiario/,
            /movimiento/,
            /referencia/,
        ])
        : 1;

    const debitColumn = hasHeader
        ? findColumn(headers, [/cargo/, /debito/, /debit/, /salida/, /egreso/])
        : -1;
    const creditColumn = hasHeader
        ? findColumn(headers, [/abono/, /credito/, /credit/, /entrada/, /ingreso/])
        : -1;

    if (debitColumn >= 0 && creditColumn >= 0) {
        return {
            hasHeader,
            dateColumn: Math.max(dateColumn, 0),
            descriptionColumn,
            amountMode: "debitCredit",
            amountColumn: -1,
            debitColumn,
            creditColumn,
            dateFormat: "auto",
        };
    }

    const amountColumn = hasHeader
        ? findColumn(
            headers,
            [/monto/, /importe/, /amount/, /valor/],
            [/saldo/, /balance/]
        )
        : -1;
    const fallbackColumn = Math.max(
        (hasHeader ? headers.length : firstRow.length) - 1,
        0
    );

    return {
        hasHeader,
        dateColumn: Math.max(dateColumn, 0),
        descriptionColumn,
        amountMode: "single",
        amountColumn: amountColumn >= 0 ? amountColumn : fallbackColumn,
        debitColumn: -1,
        creditColumn: -1,
        dateFormat: "auto",
    };
};

export const buildBankLines = (
    rows: string[][],
    mapping: ColumnMapping
): BuildLinesResult => {
    const dataRows = mapping.hasHeader ? rows.slice(1) : rows;
    const lines: ImportBankLineInput[] = [];
    const errors: LineParseError[] = [];
    let incomeTotal = 0;
    let expenseTotal = 0;

    dataRows.forEach((row, index) => {
        const rowNumber = mapping.hasHeader ? index + 2 : index + 1;
        const raw = row.join(" | ");
        const date = parseBankDate(row[mapping.dateColumn] ?? "", mapping.dateFormat);

        if (!date) {
            errors.push({
                rowNumber,
                message: "Fecha inválida o vacía",
                raw,
            });
            return;
        }

        const description = (
            mapping.descriptionColumn >= 0
                ? row[mapping.descriptionColumn] ?? ""
                : ""
        ).trim();

        let amount: number | null = null;
        let type: "INCOME" | "EXPENSE" | null = null;

        if (mapping.amountMode === "single") {
            const value = parseBankAmount(row[mapping.amountColumn] ?? "");
            if (value !== null && value !== 0) {
                amount = Math.abs(value);
                type = value < 0 ? "EXPENSE" : "INCOME";
            }
        } else {
            const debit = Math.abs(parseBankAmount(row[mapping.debitColumn] ?? "") ?? 0);
            const credit = Math.abs(parseBankAmount(row[mapping.creditColumn] ?? "") ?? 0);
            if (debit > 0) {
                amount = debit;
                type = "EXPENSE";
            } else if (credit > 0) {
                amount = credit;
                type = "INCOME";
            }
        }

        if (amount === null || type === null || amount <= 0) {
            errors.push({
                rowNumber,
                message: "Monto inválido o vacío",
                raw,
            });
            return;
        }

        const rounded = Math.round(amount * 100) / 100;
        if (type === "INCOME") incomeTotal += rounded;
        else expenseTotal += rounded;

        lines.push({
            date,
            description: (description || "Movimiento bancario").slice(0, 255),
            amount: rounded,
            type,
        });
    });

    return {
        lines,
        errors,
        incomeTotal: Math.round(incomeTotal * 100) / 100,
        expenseTotal: Math.round(expenseTotal * 100) / 100,
    };
};
