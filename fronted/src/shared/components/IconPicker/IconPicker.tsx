import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

import { getIcon } from "../../utils/GetIcon";
import { ICON_NAMES } from "../../utils/iconRegistry";
import { usePopoverPlacement } from "../../Hooks/usePopoverPlacement";

import type { BaseInputProps } from "../types";

import "./IconPicker.css";

const DEFAULT_ICONS = [
  "Wallet",
  "PiggyBank",
  "CreditCard",
  "ShoppingBag",
  "Utensils",
  "Car",
  "Home",
  "Zap",
];

interface IconPickerProps
  extends BaseInputProps<string> {
  icons?: string[];

  iconsOnly?: boolean;

  icon?: string;
}

export const IconPicker = ({
  value = "HelpCircle",
  onChange,

  label = "Icono",

  error,

  icons = DEFAULT_ICONS,

  disabled,

  icon = "Image",

  iconsOnly = false,

  name,
  id,

  className,
}: IconPickerProps) => {
  const [search, setSearch] = useState("");

  const [isOpen, setIsOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const generatedId = useId();
  const inputId = id ?? name ?? `icon-picker-${generatedId.replace(/:/g, "")}`;
  const errorId = `${generatedId.replace(/:/g, "")}-error`;

  /* Abre hacia arriba / alineado a la derecha si no hay espacio */
  const placement = usePopoverPlacement(isOpen, containerRef, popoverRef);

  useEffect(() => {
    const handleClickOutside = (
      event: MouseEvent
    ) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(
          event.target as Node
        )
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    /* Escape cierra el selector de iconos y no el modal contenedor */
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      setIsOpen(false);
    };

    document.addEventListener("keydown", handleEscape, true);
    return () =>
      document.removeEventListener("keydown", handleEscape, true);
  }, [isOpen]);

  const filteredIcons = useMemo(() => {
    if (!search) return icons;

    return ICON_NAMES
      .filter((name) =>
        name
          .toLowerCase()
          .includes(search.toLowerCase())
      )
      .slice(0, 12);
  }, [search, icons]);

  return (
    <div
      ref={containerRef}
      className={`
        custom-form-group
        ${error ? "has-error" : ""}
        ${disabled ? "disabled" : ""}
        ${className ?? ""}
      `}
    >
      {label && (
        <label
          htmlFor={inputId}
          className="input-label"
        >
          {getIcon(icon)}
          {label}
        </label>
      )}

      <div className="icon-picker-container">
        <button
          id={inputId}
          type="button"
          className="icon-trigger"
          disabled={disabled}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          onClick={() =>
            setIsOpen((prev) => !prev)
          }
        >
          {value && getIcon(value, {
            defaultIcon: "HelpCircle",
          })}

          <span>
            {value || "Seleccionar..."}
          </span>
        </button>

        {isOpen && (
          <div
            ref={popoverRef}
            role="dialog"
            aria-label="Seleccionar icono"
            className={[
              "icon-popover",
              placement.up ? "open-up" : "",
              placement.alignRight ? "align-right" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {!iconsOnly && (
              <input
                autoFocus
                type="text"
                placeholder="Buscar icono..."
                className="icon-search-input"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
              />
            )}

            <div className="icon-grid">
              {filteredIcons.map((iconName) => (
                <button
                  key={iconName}
                  type="button"
                  className={`
                    icon-grid-item tooltip-top tooltip-anchor
                    ${value === iconName
                      ? "active"
                      : ""
                    }
                  `}
                  data-tooltip={iconName}
                  onClick={() => {
                    onChange(iconName);
                    setIsOpen(false);
                  }}
                >
                  {getIcon(iconName, {
                    defaultIcon:
                      "HelpCircle",
                  })}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {error && (
        <span id={errorId} className="error-text" role="alert">
          {error}
        </span>
      )}
    </div>
  );
};