import { Hono } from "hono";
import { AppEnv } from "../types";
import { zodErrorResponse } from "../helpers/zodErrorResponse";
import { getDashboardData } from "../controllers/dashboard";
import { DashboardQuerySchema, dashboardQuerySchema } from "../schemas/dashboardQuerySchema";

export const dashboardRouter = new Hono<AppEnv>()

dashboardRouter.get('/', async (c) => {
    const userId = c.get('user').sub;
    const parsed = dashboardQuerySchema.safeParse(c.req.query());
    if (!parsed.success) {
        return zodErrorResponse(parsed.error, c)
    }
    const queryFilter: DashboardQuerySchema = {
        ...parsed.data,
    };

    return await getDashboardData(c, userId, queryFilter)
})