import dayjs from "dayjs";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { UuidSchema } from "../schemas/uuid.schema";
import type { MonthlyReportQuery } from "../schemas/reports.schema";
import { buildCsv, csvFileName, type CsvValue } from "../utils/csv";
import { ReportsService, type MonthlyReportResponse } from "./reportsService";

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const moneyFormatter = new Intl.NumberFormat("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

const formatMoney = (value: number) => `S/ ${moneyFormatter.format(value)}`;
const formatNumber = (value: number) => moneyFormatter.format(value);
const formatPercent = (value: number | null) => (value === null ? "-" : `${value}%`);
const formatGeneratedAt = () => dayjs().format("YYYY-MM-DD HH:mm");
const monthLabel = (month: string) => {
    const [year, monthNumber] = month.split("-").map(Number);
    return `${MONTHS[(monthNumber || 1) - 1]} ${year}`;
};
const periodLabel = (report: MonthlyReportResponse) =>
    `${monthLabel(report.range.from)} - ${monthLabel(report.range.to)}`;

const reportCsvRows = (report: MonthlyReportResponse): CsvValue[][] => [
    ["Reporte financiero"],
    ["Periodo", periodLabel(report)],
    ["Generado", formatGeneratedAt()],
    [],
    ["Totales"],
    ["Ingresos", formatNumber(report.totals.income)],
    ["Gastos", formatNumber(report.totals.expense)],
    ["Balance", formatNumber(report.totals.net)],
    ["Tasa de ahorro (%)", report.totals.savingsRate],
    ["Movimientos", report.totals.transactionCount],
    ["Presupuesto total", formatNumber(report.totals.totalBudget)],
    ["Uso del presupuesto (%)", report.totals.budgetUsage ?? ""],
    [],
    ["Serie mensual"],
    ["Mes", "Ingresos", "Gastos", "Balance", "Tasa de ahorro (%)", "Presupuesto", "Uso presupuesto (%)", "Movimientos"],
    ...report.months.map((month) => [
        monthLabel(month.month),
        formatNumber(month.income),
        formatNumber(month.expense),
        formatNumber(month.net),
        month.savingsRate,
        formatNumber(month.budget),
        month.budgetUsage ?? "",
        month.count,
    ]),
    [],
    ["Gastos por categoría"],
    ["Categoría", "Total", "Movimientos"],
    ...report.expenseCategories.map((category) => [
        category.name,
        formatNumber(category.total),
        category.count,
    ]),
    [],
    ["Ingresos por categoría"],
    ["Categoría", "Total", "Movimientos"],
    ...report.incomeCategories.map((category) => [
        category.name,
        formatNumber(category.total),
        category.count,
    ]),
    [],
    ["Mayores gastos"],
    ["Nombre", "Total", "Movimientos"],
    ...report.topExpenses.map((item) => [item.name, formatNumber(item.total), item.count]),
];

export const buildMonthlyReportCsv = (report: MonthlyReportResponse): string =>
    buildCsv(reportCsvRows(report));

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 40;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

type Align = "left" | "right";

interface TableOptions {
    headers: string[];
    rows: string[][];
    widths: number[];
    align?: Align[];
}

class ReportPdf {
    private readonly doc: PDFDocument;
    private page: PDFPage;
    private readonly font: PDFFont;
    private readonly bold: PDFFont;
    private y = PAGE_HEIGHT - MARGIN;

    private constructor(doc: PDFDocument, font: PDFFont, bold: PDFFont, page: PDFPage) {
        this.doc = doc;
        this.font = font;
        this.bold = bold;
        this.page = page;
    }

    static async create(): Promise<ReportPdf> {
        const doc = await PDFDocument.create();
        const font = await doc.embedFont(StandardFonts.Helvetica);
        const bold = await doc.embedFont(StandardFonts.HelveticaBold);
        const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
        return new ReportPdf(doc, font, bold, page);
    }

    private newPage() {
        this.page = this.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
        this.y = PAGE_HEIGHT - MARGIN;
    }

    private ensureSpace(height: number) {
        if (this.y - height < MARGIN + 16) this.newPage();
    }

    private fit(text: string, font: PDFFont, size: number, width: number) {
        if (font.widthOfTextAtSize(text, size) <= width) return text;
        const suffix = "...";
        let value = text;
        while (value.length > 0 && font.widthOfTextAtSize(value + suffix, size) > width) {
            value = value.slice(0, -1);
        }
        return `${value}${suffix}`;
    }

    title(text: string) {
        this.page.drawText(text, {
            x: MARGIN,
            y: this.y - 20,
            size: 20,
            font: this.bold,
            color: rgb(0.09, 0.11, 0.16),
        });
        this.y -= 30;
    }

    subtitle(text: string) {
        this.page.drawText(text, {
            x: MARGIN,
            y: this.y,
            size: 10,
            font: this.font,
            color: rgb(0.35, 0.38, 0.45),
        });
        this.y -= 16;
    }

    section(text: string) {
        this.ensureSpace(34);
        this.page.drawText(text, {
            x: MARGIN,
            y: this.y - 4,
            size: 12,
            font: this.bold,
            color: rgb(0.09, 0.11, 0.16),
        });
        this.y -= 14;
        this.page.drawLine({
            start: { x: MARGIN, y: this.y },
            end: { x: PAGE_WIDTH - MARGIN, y: this.y },
            thickness: 0.7,
            color: rgb(0.85, 0.87, 0.9),
        });
        this.y -= 10;
    }

    keyValue(label: string, value: string) {
        this.ensureSpace(18);
        this.page.drawText(label, {
            x: MARGIN,
            y: this.y,
            size: 10,
            font: this.font,
            color: rgb(0.35, 0.38, 0.45),
        });
        this.page.drawText(value, {
            x: MARGIN + 150,
            y: this.y,
            size: 10,
            font: this.bold,
            color: rgb(0.09, 0.11, 0.16),
        });
        this.y -= 18;
    }

    table({ headers, rows, widths, align = [] }: TableOptions) {
        const rowHeight = 17;
        const headerHeight = 19;
        const drawHeader = () => {
            this.ensureSpace(headerHeight + rowHeight);
            this.page.drawRectangle({
                x: MARGIN,
                y: this.y - headerHeight,
                width: CONTENT_WIDTH,
                height: headerHeight,
                color: rgb(0.95, 0.96, 0.98),
            });
            let x = MARGIN;
            headers.forEach((header, index) => {
                this.page.drawText(header, {
                    x: x + 4,
                    y: this.y - headerHeight + 5,
                    size: 8.5,
                    font: this.bold,
                    color: rgb(0.25, 0.28, 0.35),
                });
                x += widths[index] ?? 0;
            });
            this.y -= headerHeight;
        };

        drawHeader();

        for (const row of rows) {
            if (this.y - rowHeight < MARGIN + 16) {
                this.newPage();
                drawHeader();
            }

            let x = MARGIN;
            row.forEach((cell, index) => {
                const width = (widths[index] ?? 0) - 8;
                const font = this.font;
                const text = this.fit(cell, font, 8.5, width);
                const textWidth = font.widthOfTextAtSize(text, 8.5);
                const isRight = align[index] === "right";
                this.page.drawText(text, {
                    x: isRight ? x + (widths[index] ?? 0) - 4 - textWidth : x + 4,
                    y: this.y - rowHeight + 5,
                    size: 8.5,
                    font,
                    color: rgb(0.15, 0.17, 0.22),
                });
                x += widths[index] ?? 0;
            });

            this.page.drawLine({
                start: { x: MARGIN, y: this.y - rowHeight },
                end: { x: PAGE_WIDTH - MARGIN, y: this.y - rowHeight },
                thickness: 0.4,
                color: rgb(0.9, 0.91, 0.94),
            });
            this.y -= rowHeight;
        }

        this.y -= 10;
    }

    finish() {
        const pages = this.doc.getPages();
        pages.forEach((page, index) => {
            page.drawText("Finance App", {
                x: MARGIN,
                y: 20,
                size: 8,
                font: this.font,
                color: rgb(0.55, 0.58, 0.64),
            });
            const label = `Página ${index + 1} de ${pages.length}`;
            const width = this.font.widthOfTextAtSize(label, 8);
            page.drawText(label, {
                x: PAGE_WIDTH - MARGIN - width,
                y: 20,
                size: 8,
                font: this.font,
                color: rgb(0.55, 0.58, 0.64),
            });
        });
    }

    async save(): Promise<Uint8Array> {
        return this.doc.save();
    }
}

export const buildMonthlyReportPdf = async (report: MonthlyReportResponse): Promise<Uint8Array> => {
    const pdf = await ReportPdf.create();

    pdf.title("Reporte financiero");
    pdf.subtitle(`Periodo: ${periodLabel(report)}`);
    pdf.subtitle(`Generado: ${formatGeneratedAt()}`);

    pdf.section("Resumen");
    pdf.keyValue("Ingresos", formatMoney(report.totals.income));
    pdf.keyValue("Gastos", formatMoney(report.totals.expense));
    pdf.keyValue("Balance", formatMoney(report.totals.net));
    pdf.keyValue("Tasa de ahorro", `${report.totals.savingsRate}%`);
    pdf.keyValue("Movimientos", String(report.totals.transactionCount));
    pdf.keyValue("Presupuesto total", formatMoney(report.totals.totalBudget));
    pdf.keyValue("Uso del presupuesto", formatPercent(report.totals.budgetUsage));

    pdf.section("Serie mensual");
    pdf.table({
        headers: ["Mes", "Ingresos", "Gastos", "Balance", "Ahorro", "Movs."],
        widths: [75, 95, 95, 95, 75, 80],
        align: ["left", "right", "right", "right", "right", "right"],
        rows: report.months.map((month) => [
            monthLabel(month.month),
            formatMoney(month.income),
            formatMoney(month.expense),
            formatMoney(month.net),
            `${month.savingsRate}%`,
            String(month.count),
        ]),
    });

    pdf.section("Gastos por categoría");
    if (report.expenseCategories.length === 0) {
        pdf.keyValue("Sin datos", "-");
    } else {
        pdf.table({
            headers: ["Categoría", "Total", "Movimientos"],
            widths: [315, 110, 90],
            align: ["left", "right", "right"],
            rows: report.expenseCategories.slice(0, 20).map((category) => [
                category.name,
                formatMoney(category.total),
                String(category.count),
            ]),
        });
    }

    pdf.section("Mayores gastos");
    if (report.topExpenses.length === 0) {
        pdf.keyValue("Sin datos", "-");
    } else {
        pdf.table({
            headers: ["Nombre", "Total", "Movimientos"],
            widths: [315, 110, 90],
            align: ["left", "right", "right"],
            rows: report.topExpenses.map((item) => [
                item.name,
                formatMoney(item.total),
                String(item.count),
            ]),
        });
    }

    pdf.finish();
    return pdf.save();
};

export class ReportExportService {
    private reportsService = new ReportsService();

    async exportCsv(userId: UuidSchema, query: MonthlyReportQuery) {
        const report = await this.reportsService.getMonthlyReport(userId, query);
        return {
            filename: csvFileName("reporte", `${report.range.from}_${report.range.to}`),
            content: buildMonthlyReportCsv(report),
        };
    }

    async exportPdf(userId: UuidSchema, query: MonthlyReportQuery) {
        const report = await this.reportsService.getMonthlyReport(userId, query);
        return {
            filename: `reporte_${report.range.from}_${report.range.to}.pdf`,
            content: await buildMonthlyReportPdf(report),
        };
    }
}
