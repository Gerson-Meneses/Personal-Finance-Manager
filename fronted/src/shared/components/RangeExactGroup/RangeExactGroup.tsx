import type { ReactNode } from "react";
import { getIcon } from "../../utils/GetIcon";
import "./RangeExactGroup.css";

export type FilterMode = "exact" | "range";

interface RangeExactGroupProps {
    label: string;
    mode: FilterMode;
    onModeChange: (mode: FilterMode) => void;
    exactInput: ReactNode;
    rangeInputs: ReactNode;
    icon?: string;
}

export const RangeExactGroup = ({
    label,
    mode,
    onModeChange,
    exactInput,
    rangeInputs,
    icon,
}: RangeExactGroupProps) => {
    return (
        <div className="range-exact">
            <div className="range-exact__head">
                <span className="range-exact__label">
                    {icon && <span className="range-exact__icon">{getIcon(icon)}</span>}
                    {label}
                </span>

                <div
                    className="range-exact__toggle"
                    role="group"
                    aria-label={`Modo de filtro para ${label}`}
                >
                    <button
                        type="button"
                        aria-pressed={mode === "range"}
                        onClick={() => onModeChange("range")}
                        className={`range-exact__option tooltip-anchor tooltip-left ${mode === "range" ? "is-active" : ""}`}
                        data-tooltip={`Filtrar entre dos ${label.toLowerCase()}s`}
                    >
                        Rango
                    </button>
                    <button
                        type="button"
                        aria-pressed={mode === "exact"}
                        onClick={() => onModeChange("exact")}
                        className={`range-exact__option tooltip-anchor tooltip-left ${mode === "exact" ? "is-active" : ""}`}
                        data-tooltip="Filtrar un valor exacto"
                    >
                        Exacto
                    </button>
                </div>
            </div>

            <div className="range-exact__content">
                {mode === "range" ? rangeInputs : exactInput}
            </div>
        </div>
    );
};
