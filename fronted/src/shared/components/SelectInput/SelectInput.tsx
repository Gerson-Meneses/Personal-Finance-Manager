import { useEffect, useMemo, useRef, useState } from "react";

import type { BaseInputProps } from "../types";
import { getIcon } from "../../utils/GetIcon";
import { HighlightText } from "../Highlighttext/Highlighttext";

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

interface ClipBounds {
    top: number;
    bottom: number;
    left: number;
    right: number;
}

const CREATE_QUERY_VALUE = "__CREATE_QUERY__";

const removeDiacritics = (str: string) =>
    str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const getClipBounds = (
    el: HTMLElement
): ClipBounds => {
    let node = el.parentElement;

    while (node) {
        const style = getComputedStyle(node);

        if (
            style.overflowY !== "visible" ||
            style.overflowX !== "visible"
        ) {
            const rect = node.getBoundingClientRect();
            return {
                top: rect.top,
                bottom: rect.bottom,
                left: rect.left,
                right: rect.right,
            };
        }

        node = node.parentElement;
    }

    return {
        top: 0,
        bottom: window.innerHeight,
        left: 0,
        right: window.innerWidth,
    };
};

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
    const inputId = id ?? name ?? "select-input";

    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [activeIndex, setActiveIndex] = useState(-1);
    const [menuPos, setMenuPos] = useState({
        up: false,
        alignRight: false,
    });

    const rootRef = useRef<HTMLDivElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLUListElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);

    const selectedOption = options.find(
        (op) => op.value === (value ?? "")
    );

    const term = search.trim();
    const showSearch =
        (searchable ?? options.length > 4) &&
        options.length > 0;

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
        if (showSearch) {
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
        setActiveIndex(-1);
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
        if (!open || activeIndex < 0) return;
        const active =
            menuRef.current?.querySelector(
                '[data-active="true"]'
            );
        active?.scrollIntoView({ block: "nearest" });
    }, [open, activeIndex]);

    /* Evita que el menú quede recortado (modales con overflow) */
    useEffect(() => {
        if (!open) return;

        const frame = requestAnimationFrame(() => {
            const root = rootRef.current;
            const panel = panelRef.current;
            if (!root || !panel) return;

            const trigger = root.getBoundingClientRect();
            const box = panel.getBoundingClientRect();
            const bounds = getClipBounds(root);

            const spaceBelow =
                bounds.bottom - trigger.bottom;
            const spaceAbove =
                trigger.top - bounds.top;
            const up =
                box.height + 8 > spaceBelow &&
                spaceAbove > spaceBelow;

            const spaceRight =
                bounds.right - trigger.right;
            const spaceLeft =
                trigger.left - bounds.left;
            const alignRight =
                box.width > spaceRight + 8 &&
                spaceLeft > spaceRight;

            setMenuPos((prev) =>
                prev.up === up &&
                prev.alignRight === alignRight
                    ? prev
                    : { up, alignRight }
            );
        });

        return () => cancelAnimationFrame(frame);
    }, [open]);

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
                className={`${defaultStyle ? "input-wrapper" : ""} select-input`}
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
                    onClick={() =>
                        open ? closeMenu() : openMenu()
                    }
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
                        {showSearch && (
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
