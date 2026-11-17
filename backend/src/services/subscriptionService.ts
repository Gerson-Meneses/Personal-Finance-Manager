import dayjs from "dayjs";
import { In } from "typeorm";
import { AppDataSourceProd } from "../database/dataBaseDev";
import { RecurringPayment } from "../entities/RecurringPayment.entity";
import { RecurringPaymentOccurrence } from "../entities/RecurringPaymentOccurrence.entity";
import { UuidSchema } from "../schemas/uuid.schema";
import {
    RecurrenceFrequency,
    RecurringEntryType,
    RecurringLoanAction,
    RecurringOccurrenceStatus,
} from "../utils/Enums";
import { money } from "../utils/normalizarMoney";
import { daysInRange } from "./recurringPaymentService";

export interface SubscriptionAccountInfo {
    id: string;
    name: string;
    color?: string;
    icon?: string;
}

export interface SubscriptionCategoryInfo {
    id: string;
    name: string;
    color?: string;
    icon?: string;
}

export interface SubscriptionItem {
    id: string;
    name: string;
    description?: string | null;
    amount: number;
    frequency: RecurrenceFrequency;
    intervalCount: number;
    monthlyEquivalent: number;
    yearlyEquivalent: number;
    nextDueDate: string | null;
    isActive: boolean;
    autoDebit: boolean;
    lastAmount?: number | null;
    previousAmount?: number | null;
    priceChange?: number | null;
    account?: SubscriptionAccountInfo;
    category?: SubscriptionCategoryInfo;
}

export interface SubscriptionSummary {
    monthlyTotal: number;
    yearlyTotal: number;
    activeCount: number;
    pausedCount: number;
    nextCharge: {
        id: string;
        name: string;
        amount: number;
        date: string;
    } | null;
}

export interface SubscriptionHubResponse {
    generatedAt: string;
    summary: SubscriptionSummary;
    subscriptions: SubscriptionItem[];
}

const round2 = (value: number) => Math.round(value * 100) / 100;

/** Convierte el monto de una regla a su equivalente mensual en moneda. */
export const monthlyEquivalent = (
    amount: number,
    frequency: RecurrenceFrequency,
    intervalCount = 1
): number => {
    const step = Math.max(1, intervalCount);

    switch (frequency) {
        case RecurrenceFrequency.WEEKLY:
            return round2((amount * 52) / 12 / step);
        case RecurrenceFrequency.BIWEEKLY:
            return round2((amount * 26) / 12 / step);
        case RecurrenceFrequency.FIFTEEN_DAYS:
            return round2((amount * (365 / 15)) / 12 / step);
        case RecurrenceFrequency.MONTHLY:
            return round2(amount / step);
        case RecurrenceFrequency.YEARLY:
            return round2(amount / (12 * step));
        case RecurrenceFrequency.ONCE:
        default:
            return round2(amount);
    }
};

export class SubscriptionService {
    private paymentRepo = AppDataSourceProd.getRepository(RecurringPayment);
    private occurrenceRepo = AppDataSourceProd.getRepository(RecurringPaymentOccurrence);

    async getHub(userId: UuidSchema): Promise<SubscriptionHubResponse> {
        const payments = await this.paymentRepo.find({
            where: {
                user: { id: userId },
                type: RecurringEntryType.EXPENSE,
                loanAction: RecurringLoanAction.NONE,
            },
            relations: ["account", "category"],
            order: { name: "ASC" },
        });

        const subscriptions = payments.filter(
            (payment) => payment.frequency !== RecurrenceFrequency.ONCE
        );
        const ids = subscriptions.map((payment) => payment.id);
        const history = new Map<string, number[]>();

        if (ids.length > 0) {
            const paid = await this.occurrenceRepo.find({
                where: {
                    userId,
                    paymentId: In(ids),
                    status: RecurringOccurrenceStatus.PAID,
                },
                order: { dueDate: "DESC" },
                take: 1_000,
            });

            for (const occurrence of paid) {
                const amounts = history.get(occurrence.paymentId) ?? [];
                if (amounts.length < 2) {
                    amounts.push(occurrence.executedAmount ?? occurrence.amount);
                    history.set(occurrence.paymentId, amounts);
                }
            }
        }

        const today = dayjs().startOf("day").format("YYYY-MM-DD");
        const horizon = dayjs().add(2, "year").format("YYYY-MM-DD");

        const items: SubscriptionItem[] = subscriptions.map((payment) => {
            const amount = money(payment.amount);
            const monthly = monthlyEquivalent(amount, payment.frequency, payment.intervalCount);
            const amounts = history.get(payment.id) ?? [];
            const lastAmount = amounts[0] !== undefined ? money(amounts[0]) : null;
            const previousAmount = amounts[1] !== undefined ? money(amounts[1]) : null;
            const priceChange =
                lastAmount !== null && previousAmount !== null
                    ? round2(lastAmount - previousAmount)
                    : null;

            return {
                id: payment.id,
                name: payment.name,
                description: payment.description ?? null,
                amount,
                frequency: payment.frequency,
                intervalCount: payment.intervalCount,
                monthlyEquivalent: monthly,
                yearlyEquivalent: round2(monthly * 12),
                nextDueDate: daysInRange(payment, today, horizon)[0] ?? null,
                isActive: payment.isActive,
                autoDebit: payment.autoDebit,
                lastAmount,
                previousAmount,
                priceChange,
                account: payment.account
                    ? {
                        id: payment.account.id,
                        name: payment.account.name,
                        color: payment.account.color,
                        icon: payment.account.icon,
                    }
                    : undefined,
                category: payment.category
                    ? {
                        id: payment.category.id,
                        name: payment.category.name,
                        color: payment.category.color,
                        icon: payment.category.icon,
                    }
                    : undefined,
            };
        });

        items.sort((a, b) => {
            if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
            if (a.nextDueDate && b.nextDueDate) return a.nextDueDate.localeCompare(b.nextDueDate);
            if (a.nextDueDate) return -1;
            if (b.nextDueDate) return 1;
            return a.name.localeCompare(b.name);
        });

        const active = items.filter((item) => item.isActive);
        const monthlyTotal = round2(
            active.reduce((sum, item) => sum + item.monthlyEquivalent, 0)
        );
        const next = active
            .filter((item) => item.nextDueDate)
            .sort((a, b) => (a.nextDueDate ?? "").localeCompare(b.nextDueDate ?? ""))[0];

        return {
            generatedAt: new Date().toISOString(),
            summary: {
                monthlyTotal,
                yearlyTotal: round2(monthlyTotal * 12),
                activeCount: active.length,
                pausedCount: items.length - active.length,
                nextCharge: next
                    ? {
                        id: next.id,
                        name: next.name,
                        amount: next.amount,
                        date: next.nextDueDate as string,
                    }
                    : null,
            },
            subscriptions: items,
        };
    }
}
