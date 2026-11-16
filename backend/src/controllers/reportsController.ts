import type { Context } from "hono";
import { ReportsService } from "../services/reportsService";
import type { UuidSchema } from "../schemas/uuid.schema";
import type { MonthlyReportQuery } from "../schemas/reports.schema";

const reportsService = new ReportsService();

export const getMonthlyReport = async (
    c: Context,
    userId: UuidSchema,
    queryData: MonthlyReportQuery
) => {
    const data = await reportsService.getMonthlyReport(userId, queryData);
    return c.json(data, 200);
};
