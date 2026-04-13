const round = (n: number) => Math.round(n * 100) / 100

export const money = (value?: number | null) => round(value ?? 0) / 100;