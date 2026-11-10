import { Hono } from "hono";
import { ZodError } from "zod";
import { zValidator } from "@hono/zod-validator";
import { AppEnv } from "../types";
import { zodErrorResponse } from "../helpers/zodErrorResponse";
import { uuidParamSchema } from "../schemas/uuid.schema";
import { budgetQuerySchema, upsertBudgetSchema, type BudgetQuery, type UpsertBudgetOutput } from "../schemas/budget.schema";
import { deleteBudget, getBudgets, upsertBudget } from "../controllers/budgetController";

export const budgetRouter = new Hono<AppEnv>();

budgetRouter.get("/", async (c) => {
    const user = c.get("user");
    const parsed = budgetQuerySchema.safeParse(c.req.query());
    if (!parsed.success) return zodErrorResponse(parsed.error, c);
    return await getBudgets(c, user.sub, parsed.data as BudgetQuery);
});

budgetRouter.post(
    "/",
    zValidator("json", upsertBudgetSchema, (result, c) => {
        if (!result.success && result.error instanceof ZodError) {
            return zodErrorResponse(result.error, c);
        }
    }),
    async (c) => {
        const user = c.get("user");
        return await upsertBudget(c, user.sub, c.req.valid("json") as UpsertBudgetOutput);
    }
);

budgetRouter.delete(
    "/:id",
    zValidator("param", uuidParamSchema, (result, c) => {
        if (!result.success && result.error instanceof ZodError) {
            return zodErrorResponse(result.error, c);
        }
    }),
    async (c) => {
        const user = c.get("user");
        return await deleteBudget(c, user.sub, c.req.valid("param").id);
    }
);
