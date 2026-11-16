import dayjs from "dayjs";
import "dayjs/locale/es";
import {
    Award,
    CalendarDays,
    Flame,
    PiggyBank,
    TrendingUp,
} from "lucide-react";
import { formatCurrency } from "../../../shared/utils/formatCurrency";
import type { ReportHighlights, ReportTotals } from "../types";

dayjs.locale("es");

interface Props {
    highlights: ReportHighlights;
    totals: ReportTotals;
}

const monthText = (month: string) =>
    dayjs(`${month}-01`).format("MMMM YYYY");

export function ReportHighlightsCard({ highlights, totals }: Props) {
    const items = [];

    if (highlights.bestMonth) {
        items.push({
            icon: <Award size={16} />,
            label: "Mejor mes",
            value: monthText(highlights.bestMonth.month),
            hint: `Balance ${formatCurrency(highlights.bestMonth.net)}`,
            tone: "success",
        });
    }

    if (highlights.highestExpenseMonth) {
        items.push({
            icon: <Flame size={16} />,
            label: "Mes con más gastos",
            value: monthText(highlights.highestExpenseMonth.month),
            hint: formatCurrency(highlights.highestExpenseMonth.expense),
            tone: "danger",
        });
    }

    if (totals.totalBudget > 0) {
        items.push({
            icon: <PiggyBank size={16} />,
            label: "Uso del presupuesto",
            value:
                totals.budgetUsage === null
                    ? "—"
                    : `${totals.budgetUsage}%`,
            hint: `Presupuesto ${formatCurrency(totals.totalBudget)}`,
            tone:
                (totals.budgetUsage ?? 0) > 100
                    ? "danger"
                    : (totals.budgetUsage ?? 0) > 80
                        ? "warning"
                        : "info",
        });
    } else if (highlights.highestIncomeMonth) {
        items.push({
            icon: <TrendingUp size={16} />,
            label: "Mayor ingreso",
            value: monthText(highlights.highestIncomeMonth.month),
            hint: formatCurrency(highlights.highestIncomeMonth.income),
            tone: "success",
        });
    }

    items.push({
        icon: <CalendarDays size={16} />,
        label: "Gasto promedio",
        value: formatCurrency(totals.avgExpense),
        hint: `En ${totals.transactionCount} movimiento${totals.transactionCount === 1 ? "" : "s"}`,
        tone: "info",
    });

    return (
        <div className="card report-highlights">
            <div className="card-head">
                <h3 className="card-head-title">Puntos clave</h3>
            </div>

            <div className="report-highlights__list">
                {items.map((item) => (
                    <div
                        key={item.label}
                        className={`report-highlight is-${item.tone}`}
                    >
                        <span className="report-highlight__icon">
                            {item.icon}
                        </span>
                        <div className="report-highlight__body">
                            <span className="report-highlight__label">
                                {item.label}
                            </span>
                            <strong>{item.value}</strong>
                            <small>{item.hint}</small>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
