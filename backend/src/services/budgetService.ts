import dayjs from "dayjs";
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
