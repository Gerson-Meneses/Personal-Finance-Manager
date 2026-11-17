import { Hono } from "hono";
import { AppEnv } from "../types";
import { zodErrorResponse } from "../helpers/zodErrorResponse";
import { exportMonthlyReport, getMonthlyReport } from "../controllers/reportsController";
import {
    monthlyReportExportQuerySchema,
    monthlyReportQuerySchema,
    type MonthlyReportExportQuery,
    type MonthlyReportQuery,
} from "../schemas/reports.schema";

export const reportsRouter = new Hono<AppEnv>();

reportsRouter.get("/monthly", async (c) => {
    const userId = c.get("user").sub;
    const parsed = monthlyReportQuerySchema.safeParse(c.req.query());

    if (!parsed.success) {
        return zodErrorResponse(parsed.error, c);
    }

    return await getMonthlyReport(
        c,
        userId,
        parsed.data as MonthlyReportQuery
    );
});

reportsRouter.get("/monthly/export", async (c) => {
    const userId = c.get("user").sub;
    const parsed = monthlyReportExportQuerySchema.safeParse(c.req.query());

    if (!parsed.success) {
        return zodErrorResponse(parsed.error, c);
    }

    return await exportMonthlyReport(
        c,
        userId,
        parsed.data as MonthlyReportExportQuery
    );
});
