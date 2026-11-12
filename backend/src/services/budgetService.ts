import dayjs from "dayjs";
import { In } from "typeorm";
import { AppDataSourceProd } from "../database/dataBaseDev";
import { Budget } from "../entities/Budget.entity";
import { Category } from "../entities/Category.entity";
import { Transaction } from "../entities/Transaction.entity";
import { NotFoundError } from "../helpers/errors/domain.errors";
import { UuidSchema } from "../schemas/uuid.schema";
import type { UpsertBudgetOutput } from "../schemas/budget.schema";
import { TypeTransaction } from "../utils/Enums";
import { money } from "../utils/normalizarMoney";

export interface BudgetResponse {
    id: string;
    category: { id: string; name: string; color: string; icon?: string | null };
    month: string;
    amount: number;
    spent: number;
    remaining: number;
    percentage: number;
    overBudget: boolean;
}

export interface BudgetMonthResponse {
    month: string;
    totalBudget: number;
    totalSpent: number;
    totalRemaining: number;
    budgets: BudgetResponse[];
}

export interface BudgetSuggestion {
    category: { id: string; name: string; color: string; icon?: string | null };
    suggested: number;
    average: number;
    monthsWithData: number;
    currentBudget: number | null;
    source: "HISTORY" | "INCOME" | "STARTER";
}

export interface BudgetSuggestionResponse {
    month: string;
    lookbackMonths: number;
    monthlyIncome: number;
    suggestions: BudgetSuggestion[];
}

const LOAN_CATEGORY_NAMES = new Set(["PRESTAMOS", "DEVOLUCION DE PRESTAMO"]);

const BUDGET_INCOME_WEIGHTS: Record<string, number> = {
    VIVIENDA: 0.25,
    ALIMENTACION: 0.2,
    TRANSPORTE: 0.1,
    SERVICIOS: 0.1,
    SALUD: 0.05,
    EDUCACION: 0.05,
    ENTRETENIMIENTO: 0.05,
    COMPRAS: 0.05,
    MANTENIMIENTO: 0.04,
    SUSCRIPCIONES: 0.03,
    "OTROS GASTOS": 0.08,
};

const normalizeCategoryName = (name: string) =>
    name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toUpperCase();

export const roundBudgetSuggestion = (cents: number) => {
    if (cents <= 0) return 0;
    return Math.ceil(cents / 500) * 500;
};

export class BudgetService {
    private budgetRepo = AppDataSourceProd.getRepository(Budget);
    private categoryRepo = AppDataSourceProd.getRepository(Category);
    private transactionRepo = AppDataSourceProd.getRepository(Transaction);

    private monthRange(month: string) {
        return {
            from: dayjs(`${month}-01`).startOf("month").format("YYYY-MM-DD"),
            to: dayjs(`${month}-01`).endOf("month").format("YYYY-MM-DD"),
        };
    }

    private async spentByCategory(userId: UuidSchema, month: string) {
        const { from, to } = this.monthRange(month);
        const rows = await this.transactionRepo
            .createQueryBuilder("t")
            .select("t.categoryId", "categoryId")
            .addSelect("COALESCE(SUM(t.amount), 0)", "spent")
            .where("t.userId = :userId", { userId })
            .andWhere("t.type = :type", { type: TypeTransaction.EXPENSE })
            .andWhere("t.date >= :from", { from })
            .andWhere("t.date <= :to", { to })
            .andWhere("t.categoryId IS NOT NULL")
            .groupBy("t.categoryId")
            .getRawMany<{ categoryId: string; spent: string }>();

        return new Map(rows.map((row) => [row.categoryId, Number(row.spent)]));
    }

    private mapBudget(budget: Budget, spentCents: number): BudgetResponse {
        const spent = money(spentCents);
        const amount = money(budget.amount);
        const remaining = money(budget.amount - spentCents);
        const percentage = budget.amount > 0 ? Math.round((spentCents / budget.amount) * 100) : 0;

        return {
            id: budget.id,
            category: {
                id: budget.category.id,
                name: budget.category.name,
                color: budget.category.color,
                icon: budget.category.icon,
            },
            month: budget.month,
            amount,
            spent,
            remaining,
            percentage,
            overBudget: spentCents > budget.amount && budget.amount > 0,
        };
    }

    async getBudgets(userId: UuidSchema, month?: string): Promise<BudgetMonthResponse> {
        const targetMonth = month ?? dayjs().format("YYYY-MM");
        const [budgets, spent] = await Promise.all([
            this.budgetRepo.find({
                where: { userId, month: targetMonth },
                relations: ["category"],
                order: { createdAt: "ASC" },
            }),
            this.spentByCategory(userId, targetMonth),
        ]);

        const items = budgets.map((budget) => this.mapBudget(budget, spent.get(budget.categoryId) ?? 0));
        const totalBudget = items.reduce((sum, item) => sum + item.amount, 0);
        const totalSpent = items.reduce((sum, item) => sum + item.spent, 0);

        return {
            month: targetMonth,
            totalBudget: money(totalBudget * 100),
            totalSpent: money(totalSpent * 100),
            totalRemaining: money((totalBudget - totalSpent) * 100),
            budgets: items,
        };
    }

    async getSuggestions(
        userId: UuidSchema,
        month: string,
        lookbackMonths = 3
    ): Promise<BudgetSuggestionResponse> {
        const targetStart = dayjs(`${month}-01`).startOf("month");
        const from = targetStart.subtract(lookbackMonths, "month").format("YYYY-MM-DD");
        const to = targetStart.subtract(1, "day").format("YYYY-MM-DD");

        const [categories, budgets, expenseRows, incomeRow] = await Promise.all([
            this.categoryRepo.find({
                where: { user: { id: userId }, type: TypeTransaction.EXPENSE },
                order: { name: "ASC" },
            }),
            this.budgetRepo.find({ where: { userId, month } }),
            this.transactionRepo
                .createQueryBuilder("t")
                .select("t.categoryId", "categoryId")
                .addSelect("COALESCE(SUM(t.amount), 0)", "total")
                .addSelect("COUNT(DISTINCT TO_CHAR(t.date, 'YYYY-MM'))", "months")
                .where("t.userId = :userId", { userId })
                .andWhere("t.type = :type", { type: TypeTransaction.EXPENSE })
                .andWhere("t.categoryId IS NOT NULL")
                .andWhere("t.date >= :from", { from })
                .andWhere("t.date <= :to", { to })
                .groupBy("t.categoryId")
                .getRawMany<{ categoryId: string; total: string; months: string }>(),
            this.transactionRepo
                .createQueryBuilder("t")
                .select("COALESCE(SUM(t.amount), 0)", "total")
                .where("t.userId = :userId", { userId })
                .andWhere("t.type = :type", { type: TypeTransaction.INCOME })
                .andWhere("t.date >= :from", { from })
                .andWhere("t.date <= :to", { to })
                .getRawOne<{ total: string }>(),
        ]);

        const spentByCategory = new Map(
            expenseRows.map((row) => [
                row.categoryId,
                { total: Number(row.total), months: Number(row.months) },
            ])
        );
        const currentBudgets = new Map(budgets.map((budget) => [budget.categoryId, budget.amount]));
        const monthlyIncomeCents = Number(incomeRow?.total ?? 0) / Math.max(1, lookbackMonths);
        const fallbackBaseCents = monthlyIncomeCents > 0 ? monthlyIncomeCents : 100_000;

        const suggestions = categories
            .filter((category) => !LOAN_CATEGORY_NAMES.has(normalizeCategoryName(category.name)))
            .map<BudgetSuggestion>((category) => {
                const history = spentByCategory.get(category.id);
                const averageCents = history ? history.total / Math.max(1, lookbackMonths) : 0;
                const weight = BUDGET_INCOME_WEIGHTS[normalizeCategoryName(category.name)] ?? 0;
                const fallbackCents = fallbackBaseCents * weight;
                const suggestedCents = history?.total
                    ? roundBudgetSuggestion(averageCents)
                    : roundBudgetSuggestion(fallbackCents);

                return {
                    category: {
                        id: category.id,
                        name: category.name,
                        color: category.color,
                        icon: category.icon,
                    },
                    suggested: money(suggestedCents),
                    average: money(Math.round(averageCents)),
                    monthsWithData: history?.months ?? 0,
                    currentBudget: currentBudgets.has(category.id)
                        ? money(currentBudgets.get(category.id)!)
                        : null,
                    source: history?.total ? "HISTORY" : monthlyIncomeCents > 0 ? "INCOME" : "STARTER",
                };
            })
            .filter((suggestion) => suggestion.suggested > 0)
            .sort((a, b) => {
                if (a.currentBudget === null && b.currentBudget !== null) return -1;
                if (a.currentBudget !== null && b.currentBudget === null) return 1;
                return b.suggested - a.suggested;
            });

        return {
            month,
            lookbackMonths,
            monthlyIncome: money(Math.round(monthlyIncomeCents)),
            suggestions,
        };
    }

    async upsertMany(
        userId: UuidSchema,
        month: string,
        items: { categoryId: string; amount: number }[]
    ): Promise<BudgetMonthResponse> {
        const categoryIds = [...new Set(items.map((item) => item.categoryId))];
        const categories = await this.categoryRepo.find({
            where: { id: In(categoryIds), user: { id: userId }, type: TypeTransaction.EXPENSE },
        });
        const categoriesById = new Map(categories.map((category) => [category.id, category]));

        if (categories.length !== categoryIds.length) {
            throw new NotFoundError("Alguna categoría no existe o no es de gasto");
        }

        const existing = await this.budgetRepo.find({ where: { userId, month } });
        const existingByCategory = new Map(existing.map((budget) => [budget.categoryId, budget]));

        const toSave = items.map((item) => {
            const budget = existingByCategory.get(item.categoryId)
                ?? this.budgetRepo.create({ userId, categoryId: item.categoryId, month, amount: 0 });
            budget.amount = item.amount;
            return budget;
        });

        if (toSave.length) await this.budgetRepo.save(toSave);
        return this.getBudgets(userId, month);
    }

    async upsertBudget(userId: UuidSchema, data: UpsertBudgetOutput): Promise<BudgetResponse> {
        const category = await this.categoryRepo.findOne({
            where: { id: data.categoryId, user: { id: userId } },
        });
        if (!category) throw new NotFoundError("Categoría no encontrada");
        if (category.type !== TypeTransaction.EXPENSE) {
            throw new NotFoundError("Solo se pueden presupuestar categorías de gasto");
        }

        let budget = await this.budgetRepo.findOne({
            where: { userId, categoryId: data.categoryId, month: data.month },
            relations: ["category"],
        });

        if (budget) {
            budget.amount = data.amount;
        } else {
            budget = this.budgetRepo.create({
                userId,
                categoryId: data.categoryId,
                month: data.month,
                amount: data.amount,
                category,
            });
        }

        const saved = await this.budgetRepo.save(budget);
        const spent = await this.spentByCategory(userId, data.month);
        return this.mapBudget(
            await this.budgetRepo.findOneOrFail({
                where: { id: saved.id, userId },
                relations: ["category"],
            }),
            spent.get(data.categoryId) ?? 0
        );
    }

    async deleteBudget(userId: UuidSchema, budgetId: UuidSchema): Promise<void> {
        const budget = await this.budgetRepo.findOne({ where: { id: budgetId, userId } });
        if (!budget) throw new NotFoundError("Presupuesto no encontrado");
        await this.budgetRepo.remove(budget);
    }
}
