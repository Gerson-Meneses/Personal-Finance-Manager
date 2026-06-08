import type { ReactNode } from "react";
import { SlidersHorizontal, X, RotateCcw } from "lucide-react";

// Estructura genérica del badge para que el wrapper no dependa de tipos de transacciones
export interface FilterBadgeItem {
    key: string;
    label: string;
    color?: string
}

interface FilterWrapperProps<T> {
    children: ReactNode;
    searchElement: ReactNode;
    orderElement?: ReactNode;
    activeCount?: number;
    isOpen: boolean;
    onToggleOpen: () => void;
    onReset: () => void;
    className?: string;
    // 🎯 Agregamos las propiedades al contrato del Wrapper
    activeFilters?: FilterBadgeItem[];
    onRemoveFilter?: (key: keyof T) => void;
}

export const FilterWrapper = <T extends Record<string, any>>({
    children,
    searchElement,
    orderElement,
    activeCount = 0,
    isOpen,
    onToggleOpen,
    onReset,
    className = "",
    activeFilters = [],
    onRemoveFilter
}: FilterWrapperProps<T>) => {
    return (
        <div className={`w-full bg-[#111a2e] border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col gap-4 ${className}`}>

            {/* 1. BARRA SUPERIOR CONSTANTE */}
            <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1 w-full">{searchElement}</div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-end cursor-pointer">
                    {orderElement && <div>{orderElement}</div>}

                    <button
                        type="button"
                        onClick={onToggleOpen}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border cursor-pointer
              ${isOpen
                                ? "bg-indigo-600 border-indigo-500 text-white"
                                : "bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-indigo-900 hover:text-white"
                            }`}
                    >
                        <SlidersHorizontal size={16} />
                        <span>Filtros</span>
                        {activeCount && activeCount > 0 && (
                            <span className="bg-indigo-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                                {activeCount}
                            </span>
                        )}
                    </button>

                    {(activeCount > 0) && (
                        <button
                            type="button"
                            onClick={onReset}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors cursor-pointer"
                        >
                            <RotateCcw size={14} />
                            <span>Limpiar</span>
                        </button>
                    )}
                </div>
            </div>

            {/* 🎯 2. FILA DE BADGES ACTIVAS (Se renderiza solo si hay filtros reales de negocio) */}
            {activeFilters.length > 0 && (
                <div className="w-full flex flex-wrap items-center gap-2 border-t border-slate-800/50 pt-3">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-1">Activos:</span>
                    {activeFilters.map((filter) => (
                        <div
                            key={filter.key}
                            className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700/60 rounded-full pl-3 pr-1.5 py-1 text-xs text-slate-200 transition-all hover:border-slate-600"
                        >
                            <span>{filter.key}: {filter.label}</span>
                            {onRemoveFilter && (
                                <button
                                    type="button"
                                    onClick={() => onRemoveFilter(filter.key)}
                                    className="p-0.5 rounded-full text-slate-400 hover:bg-slate-700 hover:text-red-400 transition-colors cursor-pointer"
                                    title="Eliminar filtro"
                                >
                                    <X size={12} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* 3. PANEL EXPANDIBLE (CONTENIDO HIJO) */}
            {isOpen && (
                <div className="w-full border-t border-slate-800/80 pt-4 animate-slide-in">
                    {children}
                </div>
            )}

        </div>
    );
};