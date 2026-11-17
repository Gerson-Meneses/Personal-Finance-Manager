import { useId } from "react";

import { getIcon } from "../../utils/GetIcon";

import type { BaseInputProps } from "../types";

import "./ColorPicker.css";

interface ColorPickerProps
  extends BaseInputProps<string> {
  icon?: string | null;
}

export const ColorPicker = ({
  value = "#000000",

  onChange,

  label = "Color",

  icon = "Palette",

  error,

  required,
  disabled,

  name,
  id,

  className,
}: ColorPickerProps) => {
  const generatedId = useId();
  const inputId =
    id ?? name ?? "color-picker";
  const errorId = `${generatedId}-error`;

  const displayValue =
    value?.toUpperCase() ?? "#000000";

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

      <div className="color-wrapper">
        <label
          htmlFor={inputId}
          className="color-preview-container"
        >
          <div
            className="color-circle"
            style={{
              backgroundColor: value ?? "#000",
            }}
          />

          <span className="color-hex">
            {displayValue}
          </span>
        </label>

        <input
          id={inputId}
          name={name}
          type="color"
          value={value ?? "#000"}
          disabled={disabled}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className="color-input-hidden"
          onChange={(e) =>
            onChange(e.target.value)
          }
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