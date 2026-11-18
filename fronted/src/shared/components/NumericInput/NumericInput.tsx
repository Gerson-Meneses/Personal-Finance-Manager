import { useId } from "react";

import { getIcon } from "../../utils/GetIcon";
import type { BaseInputProps } from "../types";
import "./NumericInput.css";

interface NumericInputProps extends BaseInputProps<string> {
  placeholder?: string;
  symbol?: string;
  icon?: string | null;
  hideLabel?: boolean;
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
  hideLabel = false,
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
  const generatedId = useId();
  const inputId = id ?? name ?? "numeric-input";
  const errorId = `${generatedId}-error`;

  const inputWidth = autoResize
    ? displayValue.length > 0
      ? `${Math.max(displayValue.length + 1, 4)}ch`
      : "5ch"
    : "100%";

  return (
    <div
      className={`
        custom-form-group
        ${error ? "has-error" : ""}
        ${disabled ? "disabled" : ""}
        ${className ?? ""}
      `}
      style={{ width: "100%" }}
    >
      {label && (
        <label htmlFor={inputId} className={`input-label ${hideLabel ? "sr-only" : ""}`}>
          {icon && getIcon(icon)}
          {label}
        </label>
      )}

      <div className="input-wrapper-num">
        {symbol && <span className="symbol-prefix">{symbol}</span>}

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
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          style={{ width: inputWidth }}
          onChange={(e) => onChange(e.target.value)}
          onFocus={(e) => e.target.select()}
        />
      </div>

      {error && (
        <span id={errorId} className="error-text" role="alert">
          {error}
        </span>
      )}
    </div>
  );
};