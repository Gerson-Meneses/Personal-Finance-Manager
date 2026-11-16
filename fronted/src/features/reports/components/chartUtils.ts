import dayjs from "dayjs";
import type { CSSProperties } from "react";

export const monthLabel = (month: string, format = "MMM YY") =>
    dayjs(`${month}-01`).format(format);

const compactFormatter = new Intl.NumberFormat("es-PE", {
    notation: "compact",
    maximumFractionDigits: 1,
});

export const compactMoney = (value: number) =>
    `S/ ${compactFormatter.format(value)}`;

export const axisTick = {
    fill: "var(--text-tertiary)",
    fontSize: 11,
};

export const tooltipStyle: CSSProperties = {
    background: "var(--bg-elevated)",
    border: "1px solid var(--border-subtle)",
    borderRadius: 12,
    boxShadow: "var(--shadow-md)",
    color: "var(--text-primary)",
    fontSize: 12,
};

export const tooltipItemStyle: CSSProperties = {
    color: "var(--text-secondary)",
};

export const tooltipLabelStyle: CSSProperties = {
    color: "var(--text-primary)",
    fontWeight: 600,
    marginBottom: 4,
};

export const legendStyle: CSSProperties = {
    fontSize: 12,
    color: "var(--text-secondary)",
    paddingTop: 8,
};
