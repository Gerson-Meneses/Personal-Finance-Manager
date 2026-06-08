import type { ReactNode } from "react";
import { getIcon } from "../../utils/GetIcon";

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
    icon
}: RangeExactGroupProps) => {
    return (
        <div className="flex flex-col gap-2 w-full">
            {/* CABECERA UNI-ESTILO: Etiqueta formal y Selector de Modo */}
            <div className="flex items-center justify-between w-full h-7">
                <span className="text-[0.75rem] text-[#64748b] uppercase tracking-[0.06em] font-medium flex items-center gap-1.5">
                    {icon && <span className="opacity-70">{getIcon(icon)}</span>}
                    {label}
                </span>

                <div className="flex bg-white/[0.03] p-0.5 rounded-lg border border-white/[0.08]">
                    <button
                        type="button"
                        onClick={() => onModeChange("range")}
                        className={`px-3 py-1 text-[0.75rem] font-medium rounded-md transition-all cursor-pointer ${
                            mode === "range"
                                ? "bg-[#38bdf8]/10 border border-[#38bdf8]/30 text-[#38bdf8] shadow-sm"
                                : "border border-transparent text-slate-400 hover:text-slate-200"
                        }`}
                    >
                        Rango
                    </button>
                    <button
                        type="button"
                        onClick={() => onModeChange("exact")}
                        className={`px-3 py-1 text-[0.75rem] font-medium rounded-md transition-all cursor-pointer ${
                            mode === "exact"
                                ? "bg-[#38bdf8]/10 border border-[#38bdf8]/30 text-[#38bdf8] shadow-sm"
                                : "border border-transparent text-slate-400 hover:text-slate-200"
                        }`}
                    >
                        Exacto
                    </button>
                </div>
            </div>

            {/* CONTENIDO CONDICIONAL */}
            <div className="w-full transition-all duration-200">
                {mode === "range" ? rangeInputs : exactInput}
            </div>
        </div>
    );
};