export type CsvValue = string | number | null | undefined;

const escapeCell = (value: CsvValue) => {
    const text = value === null || value === undefined ? "" : String(value);
    return /[";\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/** Genera CSV compatible con Excel en español (separador `;` y BOM UTF-8). */
export const buildCsv = (rows: CsvValue[][]): string => {
    const body = rows.map((row) => row.map(escapeCell).join(";")).join("\r\n");
    return `\uFEFF${body}\r\n`;
};

export const csvFileName = (prefix: string, suffix?: string) =>
    `${prefix}${suffix ? `_${suffix}` : ""}.csv`;
