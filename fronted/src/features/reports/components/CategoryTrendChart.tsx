import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { formatCurrency } from "../../../shared/utils/formatCurrency";
import type { ReportCategory, ReportMonth } from "../types";
import {
    axisTick,
    compactMoney,
    legendStyle,
    monthLabel,
    tooltipItemStyle,
    tooltipLabelStyle,
    tooltipStyle,
} from "./chartUtils";

interface Props {
    months: ReportMonth[];
    categories: ReportCategory[];
}

export function CategoryTrendChart({ months, categories }: Props) {
    const top = categories.slice(0, 5);

    const data = months.map((month, index) => {
        const row: Record<string, string | number> = {
            label: monthLabel(month.month),
        };

        let topTotal = 0;
        top.forEach((category, categoryIndex) => {
            const value = category.monthly[index] ?? 0;
            row[`cat_${categoryIndex}`] = value;
            topTotal += value;
        });

        row.other = Math.max(
            0,
            Math.round((month.expense - topTotal) * 100) / 100
        );

        return row;
    });

    const hasOther = data.some((row) => Number(row.other) > 0);
    const tickInterval = data.length > 18 ? 3 : data.length > 9 ? 1 : 0;

    return (
        <div className="report-chart">
            <ResponsiveContainer width="100%" height={320}>
                <BarChart
                    data={data}
                    margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
                >
                    <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--border-subtle)"
                        vertical={false}
                    />
                    <XAxis
                        dataKey="label"
                        tick={axisTick}
                        tickLine={false}
                        axisLine={{ stroke: "var(--border-subtle)" }}
                        interval={tickInterval}
                        minTickGap={8}
                    />
                    <YAxis
                        tick={axisTick}
                        tickLine={false}
                        axisLine={false}
                        width={64}
                        tickFormatter={(value) => compactMoney(Number(value))}
                    />
                    <Tooltip
                        formatter={(value, name) => [
                            formatCurrency(Number(value)),
                            name,
                        ]}
                        contentStyle={tooltipStyle}
                        itemStyle={tooltipItemStyle}
                        labelStyle={tooltipLabelStyle}
                        cursor={{ fill: "var(--bg-hover)" }}
                    />
                    <Legend
                        wrapperStyle={legendStyle}
                        iconType="circle"
                        iconSize={8}
                    />
                    {top.map((category, index) => (
                        <Bar
                            key={category.id ?? category.name}
                            dataKey={`cat_${index}`}
                            name={category.name}
                            stackId="expenses"
                            fill={category.color}
                            maxBarSize={28}
                        />
                    ))}
                    {hasOther && (
                        <Bar
                            dataKey="other"
                            name="Otros"
                            stackId="expenses"
                            fill="var(--text-tertiary)"
                            maxBarSize={28}
                            radius={[4, 4, 0, 0]}
                        />
                    )}
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
