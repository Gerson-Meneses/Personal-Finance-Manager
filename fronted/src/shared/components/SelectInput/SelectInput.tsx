import { useEffect, useId, useMemo, useRef, useState } from "react";

import type { BaseInputProps } from "../types";
import { getIcon } from "../../utils/GetIcon";
import { HighlightText } from "../Highlighttext/Highlighttext";
import { usePopoverPlacement } from "../../Hooks/usePopoverPlacement";

import "./SelectInput.css";
import "../../../index.css";

interface Options {
    value: string;
    label: string;
    color?: string;
}

interface SelectAccountProps
    extends BaseInputProps<string> {
    placeholder?: string;
    icon?: string | null;
    defaultStyle?: boolean;
    options: Options[];
    hideLabel?: boolean;
    compact?: boolean;
    /** Muestra el buscador interno. Por defecto aparece solo si hay más de 4 opciones */
    searchable?: boolean;
    /** Si se provee, muestra la fila `+ Crear "<texto>"` cuando el usuario escribe */
    onCreateQuery?: (query: string) => void;
}

interface Row extends Options {
    isCreate?: boolean;
}

const CREATE_QUERY_VALUE = "__CREATE_QUERY__";

/** Solo estos selects abren el buscador (y el teclado) automáticamente. */
const AUTO_SEARCH_THRESHOLD = 12;

const removeDiacritics = (str: string) =>
    str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export const SelectInput = ({
    value = "",
    onChange,
    placeholder = "Selecciona una opción",
    label = "Opción",
    icon = "LucideSquareMousePointer",
    error,
    required,
    disabled,
    defaultStyle = true,
    id,
    options,
    name,
    className,
    hideLabel = false,
    compact = false,
    searchable,
    onCreateQuery,
}: SelectAccountProps) => {
    const generatedId = useId();
    const inputId = id ?? name ?? `select-${generatedId.replace(/:/g, "")}`;

    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [activeIndex, setActiveIndex] = useState(-1);
    const [searchMode, setSearchMode] = useState(false);

    const rootRef = useRef<HTMLDivElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLUListElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);

    /* Abre el menú hacia arriba / alineado a la derecha si no hay espacio */
    const menuPos = usePopoverPlacement(open, rootRef, panelRef);

    const selectedOption = options.find(
        (op) => op.value === (value ?? "")
    );

    const term = search.trim();
    const canSearch = searchable !== false && options.length > 0;
    const autoSearch = canSearch && options.length > AUTO_SEARCH_THRESHOLD;

    const filteredOptions = useMemo(() => {
        const normalized = removeDiacritics(term);
        if (!normalized) return options;
        return options.filter((op) =>
            removeDiacritics(op.label).includes(normalized)
        );
    }, [options, term]);

    const rows = useMemo(() => {
        const list: Row[] = [];
        if (!term) {
            list.push({ value: "", label: placeholder });
        }
        list.push(...filteredOptions);
        if (term && onCreateQuery) {
            list.push({
                value: CREATE_QUERY_VALUE,
                label: `+ Crear "${term}"`,
                isCreate: true,
            });
        }
        return list;
    }, [term, placeholder, filteredOptions, onCreateQuery]);

    const openMenu = () => {
        if (disabled) return;
        setSearch("");
        setOpen(true);
        setSearchMode(autoSearch);
        if (autoSearch) {
            setActiveIndex(-1);
        } else {
            setActiveIndex(
                rows.findIndex(
                    (op) => op.value === (value ?? "")
                )
            );
        }
    };

    const closeMenu = () => {
        setOpen(false);
        setSearch("");
        setSearchMode(false);
        setActiveIndex(-1);
    };

    /** Primer clic abre el listado; segundo clic entra en modo búsqueda. */
    const handleTriggerClick = () => {
        if (!open) {
            openMenu();
            return;
        }

        if (canSearch && !searchMode) {
            setSearchMode(true);
            setActiveIndex(-1);
            return;
        }

        closeMenu();
    };

    const selectRow = (row: Row) => {
        if (row.isCreate) {
            onCreateQuery?.(term);
            closeMenu();
            return;
        }
        onChange(row.value);
        closeMenu();
    };

    useEffect(() => {
        if (!open) return;

        const handleClickOutside = (e: MouseEvent) => {
            if (
                rootRef.current &&
                !rootRef.current.contains(e.target as Node)
            ) {
                closeMenu();
            }
        };

        document.addEventListener(
            "mousedown",
            handleClickOutside
        );
        return () =>
            document.removeEventListener(
                "mousedown",
                handleClickOutside
            );
    }, [open]);

    useEffect(() => {
        if (!open) return;

        /* Escape cierra el menú (haya o no foco dentro) y no el modal */
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key !== "Escape") return;
            e.stopPropagation();
            closeMenu();
        };

        document.addEventListener("keydown", handleEscape, true);
        return () =>
            document.removeEventListener(
                "keydown",
                handleEscape,
                true
            );
    }, [open]);

    useEffect(() => {
        if (!open || activeIndex < 0) return;
        const active =
            menuRef.current?.querySelector(
                '[data-active="true"]'
            );
        active?.scrollIntoView({ block: "nearest" });
    }, [open, activeIndex]);

    const handleTriggerKeyDown = (
        e: React.KeyboardEvent<HTMLButtonElement>
    ) => {
        if (disabled) return;

        switch (e.key) {
            case "ArrowDown":
            case "ArrowUp": {
                e.preventDefault();
                if (!open) {
                    openMenu();
                    break;
                }
                const dir =
                    e.key === "ArrowDown" ? 1 : -1;
                setActiveIndex((prev) => {
                    const next = prev + dir;
                    if (next < 0) return rows.length - 1;
                    if (next >= rows.length) return 0;
                    return next;
                });
                break;
            }
            case "Enter":
            case " ": {
                e.preventDefault();
                if (!open) {
                    openMenu();
                    break;
                }
                const row = rows[activeIndex];
                if (row) selectRow(row);
                break;
            }
            case "Escape":
                if (open) {
                    e.preventDefault();
                    /* Evita que el modal contenedor también se cierre */
                    e.stopPropagation();
                    closeMenu();
                }
                break;
            case "Tab":
                closeMenu();
                break;
        }
    };

    const handleSearchKeyDown = (
        e: React.KeyboardEvent<HTMLInputElement>
    ) => {
        if (disabled) return;

        switch (e.key) {
            case "ArrowDown":
            case "ArrowUp": {
                e.preventDefault();
                const dir =
                    e.key === "ArrowDown" ? 1 : -1;
                setActiveIndex((prev) => {
                    if (prev < 0) {
                        return dir === 1
                            ? 0
                            : rows.length - 1;
                    }
                    const next = prev + dir;
                    if (next < 0) return rows.length - 1;
                    if (next >= rows.length) return 0;
                    return next;
                });
                break;
            }
            case "Enter": {
                e.preventDefault();
                const row =
                    activeIndex >= 0
                        ? rows[activeIndex]
                        : rows.find((r) => r.value !== "");
                if (row) selectRow(row);
                break;
            }
            case "Escape":
                e.preventDefault();
                e.stopPropagation();
                closeMenu();
                break;
            case "Tab":
                closeMenu();
                break;
        }
    };

    return (
        <div
            className={`
        ${defaultStyle ? "custom-form-group" : ""}
        ${error ? "has-error" : ""}
        ${disabled ? "disabled" : ""}
        ${compact ? "select-compact" : ""}
        ${className ?? ""}
      `}
        >
            {label && (
                <label
                    htmlFor={inputId}
                    className={`input-label ${hideLabel ? "sr-only" : ""}`}
                >
                    {icon && getIcon(icon)}
                    {label}
                </label>
            )}

            <div
                ref={rootRef}
                className={`${defaultStyle ? "input-wrapper" : ""} select-input ${open ? "is-open" : ""}`}
            >
                <button
                    type="button"
                    id={inputId}
                    className="select-input-trigger"
                    disabled={disabled}
                    aria-haspopup="listbox"
                    aria-expanded={open}
                    aria-required={required}
                    aria-label={label || placeholder}
                    onClick={handleTriggerClick}
                    onKeyDown={handleTriggerKeyDown}
                >
                    <span
                        className={`select-input-value ${selectedOption ? "" : "is-placeholder"}`}
                    >
                        {selectedOption
                            ? selectedOption.label
                            : placeholder}
                    </span>

                    <span
                        className={`select-input-chevron ${open ? "open" : ""}`}
                        aria-hidden="true"
                    >
                        {getIcon("ChevronDown", {
                            size: 16,
                        })}
                    </span>
                </button>

                {open && (
                    <div
                        ref={panelRef}
                        className={[
                            "select-input-panel",
                            menuPos.up ? "open-up" : "",
                            menuPos.alignRight
                                ? "align-right"
                                : "",
                        ]
                            .filter(Boolean)
                            .join(" ")}
                    >
                        {searchMode && (
                            <div className="select-input-search">
                                {getIcon("Search", { size: 14 })}
                                <input
                                    ref={searchRef}
                                    type="text"
                                    className="select-input-search-input"
                                    placeholder="Escribe para buscar..."
                                    aria-label={`Buscar en ${label || placeholder}`}
                                    value={search}
                                    autoFocus
                                    onFocus={(e) =>
                                        e.target.select()
                                    }
                                    onChange={(e) => {
                                        setSearch(e.target.value);
                                        setActiveIndex(
                                            e.target.value.trim()
                                                ? 0
                                                : -1
                                        );
                                    }}
                                    onKeyDown={handleSearchKeyDown}
                                />
                            </div>
                        )}

                        <ul
                            ref={menuRef}
                            id={`${inputId}-listbox`}
                            className="select-input-menu"
                            role="listbox"
                            aria-label={label || placeholder}
                        >
                            {rows.length === 0 && (
                                <li className="select-input-empty">
                                    Sin resultados
                                </li>
                            )}

                            {rows.map((op, index) => {
                                const isSelected =
                                    !op.isCreate &&
                                    (value ?? "") === op.value;
                                const isActive =
                                    index === activeIndex;

                                return (
                                    <li
                                        key={
                                            op.isCreate
                                                ? CREATE_QUERY_VALUE
                                                : op.value || "__placeholder__"
                                        }
                                        role="option"
                                        aria-selected={isSelected}
                                        data-active={isActive}
                                        className={[
                                            "select-input-option",
                                            op.isCreate
                                                ? "is-create"
                                                : "",
                                            op.color
                                                ? "has-color"
                                                : "",
                                            isSelected
                                                ? "is-selected"
                                                : "",
                                            isActive
                                                ? "is-active"
                                                : "",
                                        ]
                                            .filter(Boolean)
                                            .join(" ")}
                                        style={
                                            op.color
                                                ? {
                                                      borderBottomColor:
                                                          op.color,
                                                  }
                                                : undefined
                                        }
                                        onMouseEnter={() =>
                                            setActiveIndex(index)
                                        }
                                        onMouseDown={(e) =>
                                            e.preventDefault()
                                        }
                                        onClick={() =>
                                            selectRow(op)
                                        }
                                    >
                                        <span className="select-input-option-label">
                                            {op.isCreate ? (
                                                <>
                                                    {getIcon("Plus", {
                                                        size: 14,
                                                    })}
                                                    {op.label}
                                                </>
                                            ) : term ? (
                                                <HighlightText
                                                    text={op.label}
                                                    term={term}
                                                />
                                            ) : (
                                                op.label
                                            )}
                                        </span>

                                        {isSelected &&
                                            getIcon("Check", {
                                                size: 14,
                                            })}
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}

                {name && (
                    <input
                        type="hidden"
                        name={name}
                        value={value ?? ""}
                    />
                )}
            </div>

            {error && (
                <span className="error-text">
                    {error}
                </span>
            )}
        </div>
    );
};
