import { getIcon } from "../../utils/GetIcon";

import type { BaseInputProps } from "../types";

import "./TypeToggle.css";

interface ToggleOption<T = string> {
  label: string;

  value: T;

  color?: string;

  icon?: string | null;
}

interface TypeToggleProps<T = string>
  extends Omit<
    BaseInputProps<T>,
    "onChange"
  > {
  onChange: (value: T) => void;

  leftOption?: ToggleOption<T>;

  rightOption?: ToggleOption<T>;

  icon?: string | null;
}

export const TypeToggle = <
  T extends string
>({
  value,

  onChange,

  label = "Tipo",

  icon = "ArrowLeftRight",

  disabled = false,

  error,

  leftOption = {
    label: "Gasto",
    value: "EXPENSE" as T,
    color: "#ef4444",
  },

  rightOption = {
    label: "Ingreso",
    value: "INCOME" as T,
    color: "#22c55e",
  },

  id,
  name,

  className,
}: TypeToggleProps<T>) => {
  const inputId =
    id ?? name ?? "type-toggle";

  const isRightSelected =
    value === rightOption.value;

  const activeOption = isRightSelected
    ? rightOption
    : leftOption;

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLDivElement>
  ) => {
    if (disabled) return;

    if (
      e.key === "ArrowLeft" ||
      e.key === "ArrowRight"
    ) {
      onChange(
        isRightSelected
          ? leftOption.value
          : rightOption.value
      );
    }
  };

  return (
    <div
      className={`
        custom-form-group
        ${error ? "has-error" : ""}
        ${disabled ? "disabled" : ""}
        ${className ?? ""}
      `}
    >
      {label && (
        <label
          className="input-label"
          htmlFor={inputId}
        >
          {icon && getIcon(icon)}
          {label}
        </label>
      )}

      <div
        id={inputId}
        role="radiogroup"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        onKeyDown={handleKeyDown}
        className="toggle-wrapper"
        style={
          {
            "--active-color":
              activeOption.color,
          } as React.CSSProperties
        }
      >
        <div
          className={`
            toggle-slider
            ${isRightSelected
              ? "is-right"
              : "is-left"
            }
          `}
        />

        <button
          type="button"
          role="radio"
          aria-checked={
            value === leftOption.value
          }
          disabled={disabled}
          className={`
            toggle-button
            ${value === leftOption.value
              ? "active"
              : ""
            }
          `}
          onClick={() =>
            onChange(leftOption.value)
          }
        >
          {leftOption.label} {leftOption.icon && getIcon(leftOption.icon)}
        </button>

        <button
          type="button"
          role="radio"
          aria-checked={
            value === rightOption.value
          }
          disabled={disabled}
          className={`
            toggle-button
            ${value ===
              rightOption.value
              ? "active"
              : ""
            }
          `}
          onClick={() =>
            onChange(rightOption.value)
          }
        >
          {rightOption.label} {rightOption.icon && getIcon(rightOption.icon)}
        </button>
      </div>

      {error && (
        <span className="error-text">
          {error}
        </span>
      )}
    </div>
  );
};