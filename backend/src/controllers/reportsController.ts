import type { Context } from "hono";
import { ReportsService } from "../services/reportsService";
import { ReportExportService } from "../services/reportExportService";
import type { UuidSchema } from "../schemas/uuid.schema";
import type { MonthlyReportExportQuery, MonthlyReportQuery } from "../schemas/reports.schema";

const reportsService = new ReportsService();
const reportExportService = new ReportExportService();

export const getMonthlyReport = async (
    c: Context,
    userId: UuidSchema,
    queryData: MonthlyReportQuery
) => {
    const data = await reportsService.getMonthlyReport(userId, queryData);
    return c.json(data, 200);
};

export const exportMonthlyReport = async (
    c: Context,
    userId: UuidSchema,
    queryData: MonthlyReportExportQuery
) => {
    const { format, ...query } = queryData;

    if (format === "pdf") {
        const { filename, content } = await reportExportService.exportPdf(userId, query);
        const body = content.buffer.slice(
            content.byteOffset,
            content.byteOffset + content.byteLength
        ) as ArrayBuffer;
        c.header("Content-Type", "application/pdf");
        c.header("Content-Disposition", `attachment; filename="${filename}"`);
        return c.body(body, 200);
    }

    const { filename, content } = await reportExportService.exportCsv(userId, query);
    c.header("Content-Type", "text/csv; charset=utf-8");
    c.header("Content-Disposition", `attachment; filename="${filename}"`);
    return c.body(content, 200);
};
