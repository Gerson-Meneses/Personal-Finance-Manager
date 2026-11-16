import {
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
} from "recharts";
import { formatCurrency } from "../../../shared/utils/formatCurrency";
import type { ReportCategory } from "../types";
import {
    tooltipItemStyle,
    tooltipLabelStyle,
    tooltipStyle,
} from "./chartUtils";

interface Props {
    categories: ReportCategory[];
    total: number;
}

interface DonutSlice {
    name: string;
    value: number;
    color: string;
}

export function CategoryDonut({ categories, total }: Props) {
    if (total <= 0 || categories.length === 0) {
        return (
            <div className="report-empty-inline">
                <p>Sin gastos registrados en este periodo.</p>
            </div>
        );
    }

    const top = categories.slice(0, 6);
    const topTotal = top.reduce((sum, category) => sum + category.total, 0);
    const otherTotal = Math.max(0, Math.round((total - topTotal) * 100) / 100);

    const slices: DonutSlice[] = top.map((category) => ({
        name: category.name,
        value: category.total,
        color: category.color,
    }));

    if (otherTotal > 0) {
        slices.push({
            name: "Otros",
            value: otherTotal,
            color: "var(--text-tertiary)",
        });
    }

    return (
        <div className="report-donut">
            <div className="report-donut__chart">
                <ResponsiveContainer width="100%" height={210}>
                    <PieChart>
                        <Pie
                            data={slices}
                            dataKey="value"
                            nameKey="name"
                            innerRadius="60%"
                            outerRadius="86%"
                            paddingAngle={2}
                            stroke="none"
                        >
                            {slices.map((slice) => (
                                <Cell key={slice.name} fill={slice.color} />
                            ))}
                        </Pie>
                        <Tooltip
                            formatter={(value, name) => [
                                formatCurrency(Number(value)),
                                name,
                            ]}
                            contentStyle={tooltipStyle}
                            itemStyle={tooltipItemStyle}
                            labelStyle={tooltipLabelStyle}
                        />
                    </PieChart>
                </ResponsiveContainer>

                <div className="report-donut__center">
                    <span>Gastos</span>
                    <strong className="amount-font">{formatCurrency(total)}</strong>
                </div>
            </div>

            <ul className="report-donut__legend">
                {slices.map((slice) => {
                    const percent = total > 0
                        ? Math.round((slice.value / total) * 100)
                        : 0;

                    return (
                        <li key={slice.name}>
                            <span
                                className="report-donut__dot"
                                style={{ background: slice.color }}
                            />
                            <span className="report-donut__name">{slice.name}</span>
                            <span className="report-donut__amount amount-font">
                                {formatCurrency(slice.value)}
                            </span>
                            <span className="report-donut__pct">{percent}%</span>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
