import type { LucideIcon } from "lucide-react";
import {
    CalendarClock,
    ChartPie,
    ChevronDown,
    ChevronUp,
    HandCoins,
    History,
    Landmark,
    LayoutGrid,
    Maximize2,
    Minimize2,
    RotateCcw,
    Rows3,
    Settings2,
    TrendingUp,
    Wallet,
    X,
} from "lucide-react";
import {
    DASHBOARD_WIDGETS,
    type DashboardPreferences,
    type DashboardWidgetId,
} from "../preferences";
import type {
    DashboardDensity,
    DashboardLayout,
    DashboardWidgetView,
} from "../../../shared/types/dashboard";
import "./DashboardSettings.css";

interface Props {
    preferences: DashboardPreferences;
    onChange: (next: DashboardPreferences) => void;
    onReset: () => void;
    onClose?: () => void;
}

const WIDGET_ICONS: Record<DashboardWidgetId, LucideIcon> = {
    forecast: CalendarClock,
    balance: Wallet,
    quickStats: TrendingUp,
    accounts: Landmark,
    loans: HandCoins,
    expenses: ChartPie,
    recent: History,
};

const VIEW_OPTIONS: { value: DashboardWidgetView; label: string }[] = [
    { value: "full", label: "Completa" },
    { value: "compact", label: "Compacta" },
    { value: "minimal", label: "Mínima" },
];

const LAYOUT_OPTIONS: { value: DashboardLayout; label: string; icon: LucideIcon }[] = [
    { value: "grid", label: "Cuadrícula", icon: LayoutGrid },
    { value: "stack", label: "Una columna", icon: Rows3 },
];

const DENSITY_OPTIONS: { value: DashboardDensity; label: string; icon: LucideIcon }[] = [
    { value: "normal", label: "Cómoda", icon: Maximize2 },
    { value: "compact", label: "Compacta", icon: Minimize2 },
];

export function DashboardSettings({
    preferences,
    onChange,
    onReset,
    onClose,
}: Props) {
    const setLayout = (layout: DashboardLayout) =>
        onChange({ ...preferences, layout });

    const setDensity = (density: DashboardDensity) =>
        onChange({ ...preferences, density });

    const updateWidget = (
        id: DashboardWidgetId,
        patch: Partial<DashboardPreferences["widgets"][DashboardWidgetId]>
    ) =>
        onChange({
            ...preferences,
            widgets: {
                ...preferences.widgets,
                [id]: { ...preferences.widgets[id], ...patch },
            },
        });

    const moveWidget = (id: DashboardWidgetId, direction: -1 | 1) => {
        const index = preferences.order.indexOf(id);
        const target = index + direction;
        if (index < 0 || target < 0 || target >= preferences.order.length) return;

        const order = [...preferences.order];
        [order[index], order[target]] = [order[target], order[index]];
        onChange({ ...preferences, order });
    };

    return (
        <div className="dashboard-settings">
            <div className="dashboard-settings__head">
                <div className="dashboard-settings__titles">
                    <h3>
                        <Settings2 size={17} />
                        Dashboard
                    </h3>
                    <p>
                        Elige qué tarjetas ver, su nivel de detalle y el orden en
                        que aparecen.
                    </p>
                </div>

                <div className="dashboard-settings__head-actions">
                    <button
                        type="button"
                        className="btn-secondary dashboard-settings__reset"
                        onClick={onReset}
                    >
                        <RotateCcw size={14} />
                        Restaurar
                    </button>
                    {onClose && (
                        <button
                            type="button"
                            className="dashboard-settings__close tooltip-anchor tooltip-left"
                            onClick={onClose}
                            aria-label="Cerrar personalización"
                            data-tooltip="Cerrar"
                        >
                            <X size={18} />
                        </button>
                    )}
                </div>
            </div>

            <div className="dashboard-settings__global">
                <div className="dashboard-settings__field">
                    <span className="dashboard-settings__label">Distribución</span>
                    <div
                        className="dashboard-settings__segmented"
                        role="group"
                        aria-label="Distribución del dashboard"
                    >
                        {LAYOUT_OPTIONS.map((option) => {
                            const Icon = option.icon;
                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    className={
                                        preferences.layout === option.value
                                            ? "is-active"
                                            : ""
                                    }
                                    aria-pressed={preferences.layout === option.value}
                                    onClick={() => setLayout(option.value)}
                                >
                                    <Icon size={14} />
                                    {option.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="dashboard-settings__field">
                    <span className="dashboard-settings__label">Densidad</span>
                    <div
                        className="dashboard-settings__segmented"
                        role="group"
                        aria-label="Densidad de las tarjetas"
                    >
                        {DENSITY_OPTIONS.map((option) => {
                            const Icon = option.icon;
                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    className={
                                        preferences.density === option.value
                                            ? "is-active"
                                            : ""
                                    }
                                    aria-pressed={preferences.density === option.value}
                                    onClick={() => setDensity(option.value)}
                                >
                                    <Icon size={14} />
                                    {option.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="dashboard-settings__list-head">
                <span>Elementos</span>
                <small>Usa las flechas para ordenar</small>
            </div>

            <ul className="dashboard-settings__list">
                {preferences.order.map((id, index) => {
                    const definition = DASHBOARD_WIDGETS.find(
                        (widget) => widget.id === id
                    );
                    if (!definition) return null;

                    const Icon = WIDGET_ICONS[id];
                    const widget = preferences.widgets[id];
                    const locked = !!definition.locked;

                    return (
                        <li
                            key={id}
                            className={`dashboard-widget-row ${widget.visible ? "" : "is-hidden"} ${locked ? "is-locked" : ""}`}
                        >
                            <span className="dashboard-widget-row__icon">
                                <Icon size={16} />
                            </span>

                            <div className="dashboard-widget-row__info">
                                <strong>
                                    {definition.label}
                                    {locked && (
                                        <span className="dashboard-widget-row__locked">
                                            Siempre visible
                                        </span>
                                    )}
                                </strong>
                                <small>{definition.description}</small>

                                <div className="dashboard-widget-row__views">
                                    {VIEW_OPTIONS.map((option) => (
                                        <button
                                            key={option.value}
                                            type="button"
                                            className={
                                                widget.view === option.value
                                                    ? "is-active"
                                                    : ""
                                            }
                                            aria-pressed={widget.view === option.value}
                                            onClick={() =>
                                                updateWidget(id, {
                                                    view: option.value,
                                                })
                                            }
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="dashboard-widget-row__actions">
                                <button
                                    type="button"
                                    className="dashboard-widget-row__move tooltip-anchor tooltip-left"
                                    onClick={() => moveWidget(id, -1)}
                                    disabled={index === 0}
                                    aria-label={`Mover ${definition.label} hacia arriba`}
                                    data-tooltip="Subir"
                                >
                                    <ChevronUp size={15} />
                                </button>
                                <button
                                    type="button"
                                    className="dashboard-widget-row__move tooltip-anchor tooltip-left"
                                    onClick={() => moveWidget(id, 1)}
                                    disabled={index === preferences.order.length - 1}
                                    aria-label={`Mover ${definition.label} hacia abajo`}
                                    data-tooltip="Bajar"
                                >
                                    <ChevronDown size={15} />
                                </button>

                                {!locked && (
                                    <button
                                        type="button"
                                        role="switch"
                                        aria-checked={widget.visible}
                                        aria-label={`${widget.visible ? "Ocultar" : "Mostrar"} ${definition.label}`}
                                        className={`dashboard-widget-row__toggle ${widget.visible ? "is-on" : ""}`}
                                        onClick={() =>
                                            updateWidget(id, {
                                                visible: !widget.visible,
                                            })
                                        }
                                    >
                                        <span />
                                    </button>
                                )}
                            </div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
