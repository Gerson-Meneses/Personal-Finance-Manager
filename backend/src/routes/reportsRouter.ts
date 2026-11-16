import { Hono } from "hono";
import { AppEnv } from "../types";
import { zodErrorResponse } from "../helpers/zodErrorResponse";
import { getMonthlyReport } from "../controllers/reportsController";
import {
    monthlyReportQuerySchema,
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
