import { Context } from "hono";
import { DashboardData, dashboardService } from "../services/dashboardService";
import { UuidSchema } from "../schemas/uuid.schema";
import { DashboardQuerySchema } from "../schemas/dashboardQuerySchema";


const DasboardService = new dashboardService()

export const getDashboardData = async (c: Context, userId: UuidSchema, queryData: DashboardQuerySchema) => {
    const data: DashboardData = await DasboardService.getDashboardData(userId, queryData)
    return c.json(data, 200)
}