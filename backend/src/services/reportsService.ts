import dayjs from "dayjs";
import { AppDataSourceProd } from "../database/dataBaseDev";
import { Budget } from "../entities/Budget.entity";
import { Transaction } from "../entities/Transaction.entity";
import { TransactionReportingImpact, TypeTransaction } from "../utils/Enums";
import { money } from "../utils/normalizarMoney";
import type { UuidSchema } from "../schemas/uuid.schema";
import type { MonthlyReportQuery } from "../schemas/reports.schema";

export interface ReportRange {
    from: string;
    to: string;
    months: number;
}

export interface ReportMonth {
    month: string;
    income: number;
    expense: number;
    net: number;
    savingsRate: number;
    count: number;
    budget: number;
    budgetUsage: number | null;
}

export interface ReportCategory {
    id: string | null;
    name: string;
    color: string;
    icon: string | null;
    total: number;
    count: number;
    /** Montos alineados con `months` (mismo orden y longitud). */
    monthly: number[];
}

export interface ReportTopExpense {
    name: string;
    total: number;
    count: number;
}

export interface ReportTotals {
    income: number;
    expense: number;
    net: number;
    savingsRate: number;
    transactionCount: number;
    avgIncome: number;
    avgExpense: number;
    avgNet: number;
    totalBudget: number;
    budgetUsage: number | null;
}

export interface ReportHighlights {
    bestMonth: ReportMonth | null;
    worstMonth: ReportMonth | null;
    highestExpenseMonth: ReportMonth | null;
    highestIncomeMonth: ReportMonth | null;
}

export interface MonthlyReportResponse {
    range: ReportRange;
    totals: ReportTotals;
    months: ReportMonth[];
    expenseCategories: ReportCategory[];
    incomeCategories: ReportCategory[];
    topExpenses: ReportTopExpense[];
    highlights: ReportHighlights;
}

const UNCATEGORIZED = {
    name: "Sin categoría",
    color: "#94a3b8",
} as const;

const roundRate = (value: number) => Math.round(value * 10) / 10;

/** Devuelve las claves YYYY-MM en orden ascendente terminando en `endMonth`. */
export const buildMonthKeys = (endMonth: string, count: number): string[] => {
    const safeCount = Math.max(1, Math.trunc(count));
    const end = dayjs(`${endMonth}-01`);

    return Array.from({ length: safeCount }, (_, index) =>
        end.subtract(safeCount - 1 - index, "month").format("YYYY-MM")
    );
};

interface MonthlyRow {
    month: string;
    income: string;
    expense: string;
    count: string;
}

interface CategoryRow {
    month: string;
    type: string;
    categoryId: string | null;
    name: string | null;
    color: string | null;
    icon: string | null;
    amount: string;
    count: string;
}

interface BudgetRow {
    month: string;
    total: string;
}

interface TopExpenseRow {
    name: string;
    total: string;
    count: string;
}

interface CategoryAccumulator {
    id: string | null;
    name: string;
    color: string;
    icon: string | null;
    totalCents: number;
    count: number;
    monthlyCents: number[];
}

export class ReportsService {
    private transactionRepo = AppDataSourceProd.getRepository(Transaction);
    private budgetRepo = AppDataSourceProd.getRepository(Budget);

    async getMonthlyReport(
        userId: UuidSchema,
        query: MonthlyReportQuery = {}
    ): Promise<MonthlyReportResponse> {
        const monthCount = Math.min(Math.max(Math.trunc(query.months ?? 6), 1), 36);
        const end = query.endMonth
            ? dayjs(`${query.endMonth}-01`)
            : dayjs();

        const endKey = end.format("YYYY-MM");
        const monthKeys = buildMonthKeys(endKey, monthCount);
        const fromKey = monthKeys[0];
        const from = `${fromKey}-01`;
        const to = end.endOf("month").format("YYYY-MM-DD");

        /* ------------------------------------------------------------------ */
        /* Consultas independientes -> en paralelo                             */
        /* ------------------------------------------------------------------ */

        const monthlyPromise = this.transactionRepo
            .createQueryBuilder("t")
            .select("TO_CHAR(t.date, 'YYYY-MM')", "month")
            .addSelect(
                "COALESCE(SUM(CASE WHEN t.type = :incomeType THEN t.amount ELSE 0 END), 0)",
                "income"
            )
            .addSelect(
                "COALESCE(SUM(CASE WHEN t.type = :expenseType THEN t.amount ELSE 0 END), 0)",
                "expense"
            )
            .addSelect("COUNT(t.id)", "count")
            .where("t.userId = :userId", { userId })
            .andWhere("t.reportingImpact = :impact", {
                impact: TransactionReportingImpact.REPORTABLE,
            })
            .andWhere("t.type IN (:...types)", {
                types: [TypeTransaction.INCOME, TypeTransaction.EXPENSE],
            })
            .andWhere("t.date >= :from", { from })
            .andWhere("t.date <= :to", { to })
            .setParameters({
                incomeType: TypeTransaction.INCOME,
                expenseType: TypeTransaction.EXPENSE,
            })
            .groupBy("TO_CHAR(t.date, 'YYYY-MM')")
            .getRawMany<MonthlyRow>();

        const categoryPromise = this.transactionRepo
            .createQueryBuilder("t")
            .leftJoin("t.category", "category")
            .select("TO_CHAR(t.date, 'YYYY-MM')", "month")
            .addSelect("t.type", "type")
            .addSelect("t.categoryId", "categoryId")
            .addSelect("category.name", "name")
            .addSelect("category.color", "color")
            .addSelect("category.icon", "icon")
            .addSelect("COALESCE(SUM(t.amount), 0)", "amount")
            .addSelect("COUNT(t.id)", "count")
            .where("t.userId = :userId", { userId })
            .andWhere("t.reportingImpact = :impact", {
                impact: TransactionReportingImpact.REPORTABLE,
            })
            .andWhere("t.type IN (:...types)", {
                types: [TypeTransaction.INCOME, TypeTransaction.EXPENSE],
            })
            .andWhere("t.date >= :from", { from })
            .andWhere("t.date <= :to", { to })
            .groupBy("TO_CHAR(t.date, 'YYYY-MM')")
            .addGroupBy("t.type")
            .addGroupBy("t.categoryId")
            .addGroupBy("category.name")
            .addGroupBy("category.color")
            .addGroupBy("category.icon")
            .getRawMany<CategoryRow>();

        const topExpensesPromise = this.transactionRepo
            .createQueryBuilder("t")
            .select("t.name", "name")
            .addSelect("COALESCE(SUM(t.amount), 0)", "total")
            .addSelect("COUNT(t.id)", "count")
            .where("t.userId = :userId", { userId })
            .andWhere("t.type = :expenseType", { expenseType: TypeTransaction.EXPENSE })
            .andWhere("t.reportingImpact = :impact", {
                impact: TransactionReportingImpact.REPORTABLE,
            })
            .andWhere("t.date >= :from", { from })
            .andWhere("t.date <= :to", { to })
            .groupBy("t.name")
            .orderBy("SUM(t.amount)", "DESC")
            .limit(8)
            .getRawMany<TopExpenseRow>();

        const budgetPromise = this.budgetRepo
            .createQueryBuilder("b")
            .select("b.month", "month")
            .addSelect("COALESCE(SUM(b.amount), 0)", "total")
            .where("b.userId = :userId", { userId })
            .andWhere("b.month BETWEEN :fromKey AND :toKey", {
                fromKey,
                toKey: endKey,
            })
            .groupBy("b.month")
            .getRawMany<BudgetRow>();

        const [monthlyRows, categoryRows, topExpenseRows, budgetRows] =
            await Promise.all([
                monthlyPromise,
                categoryPromise,
                topExpensesPromise,
                budgetPromise,
            ]);

        /* ------------------------------------------------------------------ */
        /* Serie mensual                                                       */
        /* ------------------------------------------------------------------ */

        const monthlyByMonth = new Map(monthlyRows.map((row) => [row.month, row]));
        const budgetByMonth = new Map(
            budgetRows.map((row) => [row.month, Number(row.total)])
        );

        const months: ReportMonth[] = monthKeys.map((month) => {
            const raw = monthlyByMonth.get(month);
            const incomeCents = Number(raw?.income ?? 0);
            const expenseCents = Number(raw?.expense ?? 0);
            const budgetCents = budgetByMonth.get(month) ?? 0;
            const income = money(incomeCents);
            const expense = money(expenseCents);
            const net = money(incomeCents - expenseCents);

            return {
                month,
                income,
                expense,
                net,
                savingsRate:
                    incomeCents > 0 ? roundRate((net / income) * 100) : 0,
                count: Number(raw?.count ?? 0),
                budget: money(budgetCents),
                budgetUsage:
                    budgetCents > 0
                        ? roundRate((expenseCents / budgetCents) * 100)
                        : null,
            };
        });

        /* ------------------------------------------------------------------ */
        /* Totales                                                             */
        /* ------------------------------------------------------------------ */

        const incomeCents = monthlyRows.reduce(
            (sum, row) => sum + Number(row.income ?? 0),
            0
        );
        const expenseCents = monthlyRows.reduce(
            (sum, row) => sum + Number(row.expense ?? 0),
            0
        );
        const transactionCount = monthlyRows.reduce(
            (sum, row) => sum + Number(row.count ?? 0),
            0
        );
        const budgetCents = budgetRows.reduce(
            (sum, row) => sum + Number(row.total ?? 0),
            0
        );
        const netCents = incomeCents - expenseCents;

        const totals: ReportTotals = {
            income: money(incomeCents),
            expense: money(expenseCents),
            net: money(netCents),
            savingsRate:
                incomeCents > 0 ? roundRate((netCents / incomeCents) * 100) : 0,
            transactionCount,
            avgIncome: money(Math.round(incomeCents / monthCount)),
            avgExpense: money(Math.round(expenseCents / monthCount)),
            avgNet: money(Math.round(netCents / monthCount)),
            totalBudget: money(budgetCents),
            budgetUsage:
                budgetCents > 0
                    ? roundRate((expenseCents / budgetCents) * 100)
                    : null,
        };

        /* ------------------------------------------------------------------ */
        /* Categorías                                                          */
        /* ------------------------------------------------------------------ */

        const monthIndex = new Map(monthKeys.map((month, index) => [month, index]));
        const expenseMap = new Map<string, CategoryAccumulator>();
        const incomeMap = new Map<string, CategoryAccumulator>();

        for (const row of categoryRows) {
            const target = row.type === TypeTransaction.EXPENSE
                ? expenseMap
                : incomeMap;
            const key = row.categoryId ?? "__uncategorized__";

            let accumulator = target.get(key);
            if (!accumulator) {
                accumulator = {
                    id: row.categoryId,
                    name: row.categoryId
                        ? row.name ?? UNCATEGORIZED.name
                        : UNCATEGORIZED.name,
                    color: row.categoryId
                        ? row.color ?? UNCATEGORIZED.color
                        : UNCATEGORIZED.color,
                    icon: row.categoryId ? row.icon ?? null : null,
                    totalCents: 0,
                    count: 0,
                    monthlyCents: monthKeys.map(() => 0),
                };
                target.set(key, accumulator);
            }

            const amountCents = Number(row.amount ?? 0);
            accumulator.totalCents += amountCents;
            accumulator.count += Number(row.count ?? 0);

            const index = monthIndex.get(row.month);
            if (index !== undefined) {
                accumulator.monthlyCents[index] += amountCents;
            }
        }

        const toReportCategories = (
            map: Map<string, CategoryAccumulator>
        ): ReportCategory[] =>
            [...map.values()]
                .sort((a, b) => b.totalCents - a.totalCents)
                .map((item) => ({
                    id: item.id,
                    name: item.name,
                    color: item.color,
                    icon: item.icon,
                    total: money(item.totalCents),
                    count: item.count,
                    monthly: item.monthlyCents.map((amount) => money(amount)),
                }));

        const expenseCategories = toReportCategories(expenseMap);
        const incomeCategories = toReportCategories(incomeMap);

        const topExpenses: ReportTopExpense[] = topExpenseRows.map((row) => ({
            name: row.name,
            total: money(Number(row.total ?? 0)),
            count: Number(row.count ?? 0),
        }));

        /* ------------------------------------------------------------------ */
        /* Highlights                                                          */
        /* ------------------------------------------------------------------ */

        const activeMonths = months.filter((month) => month.count > 0);
        const byNetDesc = [...activeMonths].sort((a, b) => b.net - a.net);
        const byNetAsc = [...activeMonths].sort((a, b) => a.net - b.net);
        const byExpense = [...activeMonths].sort((a, b) => b.expense - a.expense);
        const byIncome = [...activeMonths].sort((a, b) => b.income - a.income);

        const highlights: ReportHighlights = {
            bestMonth: byNetDesc[0] ?? null,
            worstMonth: byNetAsc[0] ?? null,
            highestExpenseMonth: byExpense[0] ?? null,
            highestIncomeMonth: byIncome[0] ?? null,
        };

        return {
            range: {
                from: fromKey,
                to: endKey,
                months: monthCount,
            },
            totals,
            months,
            expenseCategories,
            incomeCategories,
            topExpenses,
            highlights,
        };
    }
}
