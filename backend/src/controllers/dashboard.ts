import { Context } from "hono";
import { DashboardResponse, DashboardService } from "../services/dashboardService";
import { UuidSchema } from "../schemas/uuid.schema";
import { DashboardQuerySchema } from "../schemas/dashboardQuerySchema";


const dasboardService = new DashboardService()

export const getDashboardData = async (c: Context, userId: UuidSchema, queryData: DashboardQuerySchema) => {
    const data: DashboardResponse = await dasboardService.getDashboard(userId, queryData)
    return c.json(data, 200)
}