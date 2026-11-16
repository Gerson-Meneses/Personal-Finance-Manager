import {
    Bar,
    CartesianGrid,
    ComposedChart,
    Legend,
    Line,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { formatCurrency } from "../../../shared/utils/formatCurrency";
import type { ReportMonth } from "../types";
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
}

export function MonthlyTrendChart({ months }: Props) {
    const data = months.map((month) => ({
        ...month,
        label: monthLabel(month.month),
    }));

    const hasBudget = months.some((month) => month.budget > 0);
    const tickInterval = data.length > 18 ? 3 : data.length > 9 ? 1 : 0;

    return (
        <div className="report-chart">
            <ResponsiveContainer width="100%" height={300}>
                <ComposedChart
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
                    <Bar
                        dataKey="income"
                        name="Ingresos"
                        fill="var(--success)"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={26}
                    />
                    <Bar
                        dataKey="expense"
                        name="Gastos"
                        fill="var(--danger)"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={26}
                    />
                    <Line
                        type="monotone"
                        dataKey="net"
                        name="Balance"
                        stroke="var(--accent)"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                    />
                    {hasBudget && (
                        <Line
                            type="monotone"
                            dataKey="budget"
                            name="Presupuesto"
                            stroke="var(--info)"
                            strokeWidth={1.5}
                            strokeDasharray="5 4"
                            dot={false}
                        />
                    )}
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
}
