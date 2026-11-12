import { Context } from "hono";
import dayjs from "dayjs";
import { UuidSchema } from "../schemas/uuid.schema";
import type {
    BudgetQuery,
    BulkUpsertBudgetOutput,
    UpsertBudgetOutput,
} from "../schemas/budget.schema";
import { BudgetService } from "../services/budgetService";

const budgetService = new BudgetService();

export const getBudgets = async (c: Context, userId: UuidSchema, query: BudgetQuery) => {
    const data = await budgetService.getBudgets(userId, query.month);
    return c.json(data, 200);
};

export const getBudgetSuggestions = async (c: Context, userId: UuidSchema, query: BudgetQuery) => {
    const data = await budgetService.getSuggestions(
        userId,
        query.month ?? dayjs().format("YYYY-MM"),
        query.lookback ?? 3
    );
    return c.json(data, 200);
};

export const upsertBudget = async (c: Context, userId: UuidSchema, data: UpsertBudgetOutput) => {
    const budget = await budgetService.upsertBudget(userId, data);
    return c.json(budget, 200);
};

export const bulkUpsertBudgets = async (
    c: Context,
    userId: UuidSchema,
    data: BulkUpsertBudgetOutput
) => {
    const budgets = await budgetService.upsertMany(userId, data.month, data.items);
    return c.json(budgets, 200);
};

export const deleteBudget = async (c: Context, userId: UuidSchema, budgetId: UuidSchema) => {
    await budgetService.deleteBudget(userId, budgetId);
    return c.body(null, 204);
};
