import type { ReactNode } from "react";
import { SlidersHorizontal, X, RotateCcw } from "lucide-react";
import ModalPortal from "../ModalPortal/ModalPortal";
import "./FilterWrapper.css";

// Estructura genérica del badge para que el wrapper no dependa de tipos de transacciones
export interface FilterBadgeItem {
    key: string;
    label: string;
    name?: string;
    color?: string;
}

interface FilterWrapperProps<T> {
    children: ReactNode;
    searchElement: ReactNode;
    orderElement?: ReactNode;
    activeCount?: number;
    isOpen: boolean;
    onToggleOpen: () => void;
    onReset: () => void;
    /** Aplica los filtros seleccionados en el modal. */
    onApply?: () => void;
    /** Limpia el borrador del modal sin aplicarlo. */
    onClearDraft?: () => void;
    className?: string;
    activeFilters?: FilterBadgeItem[];
    onRemoveFilter?: (key: keyof T) => void;
}

export const FilterWrapper = <T extends object>({
    children,
    searchElement,
    orderElement,
    activeCount = 0,
    isOpen,
    onToggleOpen,
    onReset,
    onApply,
    onClearDraft,
    className = "",
    activeFilters = [],
    onRemoveFilter,
}: FilterWrapperProps<T>) => {
    const apply = onApply ?? onToggleOpen;

    return (
        <>
            <div className={`filter-wrapper ${className}`}>
                <div className="filter-wrapper__top">
                    <div className="filter-wrapper__search">{searchElement}</div>

                    <div className="filter-wrapper__actions">
                        {orderElement && (
                            <div className="filter-wrapper__order">{orderElement}</div>
                        )}

                        <button
                            type="button"
                            onClick={onToggleOpen}
                            className={`filter-toggle ${isOpen ? "is-open" : ""}`}
                            aria-expanded={isOpen}
                            aria-haspopup="dialog"
                        >
                            <SlidersHorizontal size={16} />
                            <span>Filtros</span>
                            {activeCount > 0 && (
                                <span className="filter-count">{activeCount}</span>
                            )}
                        </button>

                        {activeCount > 0 && (
                            <button
                                type="button"
                                onClick={onReset}
                                className="filter-reset"
                            >
                                <RotateCcw size={14} />
                                <span>Limpiar</span>
                            </button>
                        )}
                    </div>
                </div>

                {activeFilters.length > 0 && (
                    <div className="filter-wrapper__badges">
                        <span className="filter-wrapper__badges-label">Activos:</span>
                        {activeFilters.map((filter) => (
                            <div key={filter.key} className="filter-badge">
                                {filter.color && (
                                    <span
                                        className="filter-badge__dot"
                                        style={{ backgroundColor: filter.color }}
                                        aria-hidden="true"
                                    />
                                )}
                                <span>
                                    {filter.name ?? filter.key}: {filter.label}
                                </span>
                                {onRemoveFilter && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            onRemoveFilter(filter.key as keyof T)
                                        }
                                        className="filter-badge__remove tooltip-anchor tooltip-left"
                                        aria-label={`Quitar filtro: ${filter.name ?? filter.key}: ${filter.label}`}
                                        data-tooltip={`Quitar filtro: ${filter.name ?? filter.key}: ${filter.label}`}
                                    >
                                        <X size={12} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <ModalPortal
                isOpen={isOpen}
                onClose={onToggleOpen}
                contentClassName="modal-content--wide"
            >
                <div className="filter-modal">
                    <header className="filter-modal__head">
                        <div className="filter-modal__titles">
                            <h2>Filtros</h2>
                            <p>
                                Ajusta los filtros y pulsa «Aplicar filtros» para
                                actualizar los resultados.
                            </p>
                        </div>
                        <button
                            type="button"
                            className="filter-modal__close tooltip-anchor tooltip-left"
                            onClick={onToggleOpen}
                            aria-label="Cerrar filtros"
                            data-tooltip="Cerrar"
                        >
                            <X size={18} />
                        </button>
                    </header>

                    <div className="filter-modal__body">{children}</div>

                    <footer className="filter-modal__footer">
                        {onClearDraft && (
                            <button
                                type="button"
                                className="filter-modal__clear"
                                onClick={onClearDraft}
                            >
                                <RotateCcw size={14} />
                                Limpiar
                            </button>
                        )}
                        <div className="filter-modal__footer-actions">
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={onToggleOpen}
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                className="btn-primary"
                                onClick={apply}
                            >
                                Aplicar filtros
                            </button>
                        </div>
                    </footer>
                </div>
            </ModalPortal>
        </>
    );
};
