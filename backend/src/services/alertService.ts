import dayjs from "dayjs";
import { AppDataSourceProd } from "../database/dataBaseDev";
import { Account } from "../entities/Account.entity";
import { PaymentNotification } from "../entities/PaymentNotification.entity";
import { UuidSchema } from "../schemas/uuid.schema";
import { TypeAccount } from "../utils/Enums";
import { getCreditCardDebt, getMaxBalance } from "../utils/getBalanceToCreditCard";
import { money } from "../utils/normalizarMoney";
import { BudgetService } from "./budgetService";

const currencyFormatter = new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
});

const formatCurrency = (value: number) => currencyFormatter.format(value);

interface AlertInput {
    kind: "BUDGET" | "CARD_DUE" | "CARD_UTILIZATION";
    dedupeKey: string;
    title: string;
    message: string;
}

export class AlertService {
    private notificationRepo = AppDataSourceProd.getRepository(PaymentNotification);
    private accountRepo = AppDataSourceProd.getRepository(Account);
    private budgetService = new BudgetService();

    async refreshAlerts(userId: UuidSchema): Promise<void> {
        const month = dayjs().format("YYYY-MM");
        await Promise.all([
            this.refreshBudgetAlerts(userId, month),
            this.refreshCardAlerts(userId, month),
        ]);
    }

    private async ensureAlert(userId: UuidSchema, alert: AlertInput): Promise<void> {
        await this.notificationRepo
            .createQueryBuilder()
            .insert()
            .into(PaymentNotification)
            .values({
                userId,
                kind: alert.kind,
                dedupeKey: alert.dedupeKey,
                title: alert.title,
                message: alert.message,
            })
            .orIgnore()
            .execute();
    }

    private async refreshBudgetAlerts(userId: UuidSchema, month: string): Promise<void> {
        const { budgets } = await this.budgetService.getBudgets(userId, month);

        for (const budget of budgets) {
            if (budget.amount <= 0) continue;

            const category = budget.category.name;
            const threshold = budget.percentage >= 100 ? 100 : budget.percentage >= 80 ? 80 : null;
            if (!threshold) continue;

            const exceeded = threshold >= 100;
            await this.ensureAlert(userId, {
                kind: "BUDGET",
                dedupeKey: `budget:${budget.id}:${month}:${threshold}`,
                title: exceeded
                    ? `Presupuesto excedido: ${category}`
                    : `Presupuesto al ${budget.percentage}%: ${category}`,
                message: exceeded
                    ? `Llevas ${formatCurrency(budget.spent)} de ${formatCurrency(budget.amount)} (${budget.percentage}%).`
                    : `Has usado ${formatCurrency(budget.spent)} de ${formatCurrency(budget.amount)} (${budget.percentage}%).`,
            });
        }
    }

    private async refreshCardAlerts(userId: UuidSchema, month: string): Promise<void> {
        const accounts = await this.accountRepo.find({
            where: { user: { id: userId }, type: TypeAccount.CREDIT },
        });
        const today = dayjs().startOf("day");

        for (const account of accounts) {
            const debtCents = getCreditCardDebt(
                account.creditLimit ?? 0,
                account.overdraft ?? 0,
                account.balance
            );
            if (debtCents <= 0) continue;

            if (account.paymentDueDay) {
                const dueDate = this.nextPaymentDate(today, account.paymentDueDay);
                const daysUntil = dueDate.diff(today, "day");

                if (daysUntil >= 0 && daysUntil <= 7) {
                    await this.ensureAlert(userId, {
                        kind: "CARD_DUE",
                        dedupeKey: `card_due:${account.id}:${dueDate.format("YYYY-MM-DD")}`,
                        title: `Pago de tarjeta próximo: ${account.name}`,
                        message: `Vence el ${dueDate.format("D MMM YYYY")} (${daysUntil === 0 ? "hoy" : `en ${daysUntil} día${daysUntil === 1 ? "" : "s"}`}). Deuda actual: ${formatCurrency(money(debtCents))}.`,
                    });
                }
            }

            const maxBalance = getMaxBalance(account.creditLimit ?? 0, account.overdraft ?? 0);
            if (maxBalance <= 0) continue;

            const usage = Math.round((debtCents / maxBalance) * 100);
            const threshold = usage >= 100 ? 100 : usage >= 80 ? 80 : null;
            if (!threshold) continue;

            await this.ensureAlert(userId, {
                kind: "CARD_UTILIZATION",
                dedupeKey: `card_utilization:${account.id}:${month}:${threshold}`,
                title:
                    threshold >= 100
                        ? `Tarjeta al límite: ${account.name}`
                        : `Tarjeta al ${usage}%: ${account.name}`,
                message: `Deuda ${formatCurrency(money(debtCents))} de ${formatCurrency(money(maxBalance))} disponibles (${usage}%).`,
            });
        }
    }

    private nextPaymentDate(today: dayjs.Dayjs, paymentDueDay: number): dayjs.Dayjs {
        const buildDate = (base: dayjs.Dayjs) => {
            const day = Math.min(Math.max(1, paymentDueDay), base.daysInMonth());
            return base.date(day).startOf("day");
        };

        let dueDate = buildDate(today);
        if (dueDate.isBefore(today)) {
            dueDate = buildDate(today.add(1, "month"));
        }
        return dueDate;
    }
}
