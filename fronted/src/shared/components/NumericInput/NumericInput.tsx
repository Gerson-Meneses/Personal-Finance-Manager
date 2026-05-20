import { getIcon } from "../../utils/GetIcon";

import type { BaseInputProps } from "../types";

import "./NumericInput.css";

interface NumericInputProps
  extends BaseInputProps<string> {
  placeholder?: string;

  symbol?: string;

  icon?: string | null;

  min?: number;
  max?: number;

  step?: number;

  autoResize?: boolean;
}

export const NumericInput = ({
  value = "",

  onChange,

  label = "Número",

  error,

  placeholder = "0.00",

  symbol,

  icon = "Hash",

  min,
  max,

  step = 0.01,

  autoResize = true,

  required,
  disabled,

  name,
  id,

  className,
}: NumericInputProps) => {
  const displayValue = value ?? "";

  const inputId =
    id ?? name ?? "numeric-input";

  const inputWidth = autoResize
    ? displayValue.length > 0
      ? `${Math.max(
          displayValue.length + 1,
          4
        )}ch`
      : "5ch"
    : undefined;

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
          htmlFor={inputId}
          className="input-label"
        >
          {icon && getIcon(icon)}
          {label}
        </label>
      )}

      <div className="input-wrapper-num">
        {symbol && (
          <span className="symbol">
            {symbol}
          </span>
        )}

        <input
          id={inputId}
          name={name}
          type="number"
          inputMode="decimal"
          className="numeric-input"
          placeholder={placeholder}
          value={displayValue}
          disabled={disabled}
          required={required}
          step={step}
          min={min}
          max={max}
          style={
            inputWidth
              ? { width: inputWidth }
              : undefined
          }
          onChange={(e) =>
            onChange(e.target.value)
          }
          onFocus={(e) => e.target.select()}
        />
      </div>

      {error && (
        <span className="error-text">
          {error}
        </span>
      )}
    </div>
  );
};