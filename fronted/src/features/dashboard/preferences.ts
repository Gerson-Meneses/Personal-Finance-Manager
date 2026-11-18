import type {
    DashboardDensity,
    DashboardLayout,
    DashboardWidgetView,
} from "../../shared/types/dashboard";

export type DashboardWidgetId =
    | "forecast"
    | "balance"
    | "quickStats"
    | "accounts"
    | "loans"
    | "expenses"
    | "recent";

export interface DashboardWidgetPreference {
    visible: boolean;
    view: DashboardWidgetView;
}

export interface DashboardPreferences {
    layout: DashboardLayout;
    density: DashboardDensity;
    order: DashboardWidgetId[];
    widgets: Record<DashboardWidgetId, DashboardWidgetPreference>;
}

export interface DashboardWidgetDefinition {
    id: DashboardWidgetId;
    label: string;
    description: string;
    defaultView: DashboardWidgetView;
    locked?: boolean;
}

export const DASHBOARD_WIDGETS: DashboardWidgetDefinition[] = [
    {
        id: "forecast",
        label: "Flujo previsto",
        description: "Pagos e ingresos programados para este mes.",
        defaultView: "full",
        locked: true,
    },
    {
        id: "balance",
        label: "Patrimonio neto",
        description: "Balance entre efectivo, crédito y deuda.",
        defaultView: "full",
    },
    {
        id: "quickStats",
        label: "Resumen del mes",
        description: "Ingresos, gastos, balance y tasa de ahorro.",
        defaultView: "full",
    },
    {
        id: "accounts",
        label: "Mis cuentas",
        description: "Tus cuentas con su saldo actual.",
        defaultView: "full",
    },
    {
        id: "loans",
        label: "Préstamos",
        description: "Lo que te deben y lo que debes.",
        defaultView: "full",
    },
    {
        id: "expenses",
        label: "Gastos por categoría",
        description: "Dónde se concentra tu gasto del mes.",
        defaultView: "full",
    },
    {
        id: "recent",
        label: "Actividad reciente",
        description: "Últimos movimientos registrados.",
        defaultView: "full",
    },
];

const WIDGET_IDS = new Set<string>(DASHBOARD_WIDGETS.map((widget) => widget.id));
const VIEWS = new Set<DashboardWidgetView>(["full", "compact", "minimal"]);

const storageKey = (userId?: string) =>
    `finance-dashboard-preferences${userId ? `:${userId}` : ""}`;

const defaultWidgets = (): Record<DashboardWidgetId, DashboardWidgetPreference> =>
    DASHBOARD_WIDGETS.reduce(
        (acc, widget) => ({
            ...acc,
            [widget.id]: {
                visible: true,
                view: widget.defaultView,
            },
        }),
        {} as Record<DashboardWidgetId, DashboardWidgetPreference>
    );

export const DEFAULT_DASHBOARD_PREFERENCES: DashboardPreferences = {
    layout: "grid",
    density: "normal",
    order: DASHBOARD_WIDGETS.map((widget) => widget.id),
    widgets: defaultWidgets(),
};

export const normalizeDashboardPreferences = (
    input?: Partial<DashboardPreferences> | null
): DashboardPreferences => {
    const widgets = defaultWidgets();
    const rawWidgets = input?.widgets ?? ({} as Partial<DashboardPreferences["widgets"]>);

    for (const widget of DASHBOARD_WIDGETS) {
        const raw = rawWidgets[widget.id];
        widgets[widget.id] = {
            visible: widget.locked ? true : raw?.visible ?? true,
            view:
                raw?.view && VIEWS.has(raw.view)
                    ? raw.view
                    : widget.defaultView,
        };
    }

    const seen = new Set<DashboardWidgetId>();
    const order: DashboardWidgetId[] = [];

    for (const id of input?.order ?? []) {
        if (!WIDGET_IDS.has(id) || seen.has(id)) continue;
        seen.add(id);
        order.push(id);
    }

    for (const widget of DASHBOARD_WIDGETS) {
        if (!seen.has(widget.id)) order.push(widget.id);
    }

    return {
        layout: input?.layout === "stack" ? "stack" : "grid",
        density: input?.density === "compact" ? "compact" : "normal",
        order,
        widgets,
    };
};

export const loadDashboardPreferences = (
    userId?: string
): DashboardPreferences => {
    if (typeof window === "undefined") return DEFAULT_DASHBOARD_PREFERENCES;

    try {
        const raw = window.localStorage.getItem(storageKey(userId));
        if (!raw) return DEFAULT_DASHBOARD_PREFERENCES;
        return normalizeDashboardPreferences(JSON.parse(raw) as DashboardPreferences);
    } catch {
        return DEFAULT_DASHBOARD_PREFERENCES;
    }
};

export const saveDashboardPreferences = (
    userId: string | undefined,
    preferences: DashboardPreferences
) => {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.setItem(
            storageKey(userId),
            JSON.stringify(normalizeDashboardPreferences(preferences))
        );
    } catch {
        // Si el almacenamiento no está disponible, se mantiene el estado en memoria.
    }
};

export const getDashboardWidgetDefinition = (id: DashboardWidgetId) =>
    DASHBOARD_WIDGETS.find((widget) => widget.id === id)!;
