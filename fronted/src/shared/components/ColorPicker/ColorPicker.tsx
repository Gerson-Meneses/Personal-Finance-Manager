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
  const inputId =
    id ?? name ?? "color-picker";

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
              backgroundColor: value,
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
          value={value}
          disabled={disabled}
          required={required}
          className="color-input-hidden"
          onChange={(e) =>
            onChange(e.target.value)
          }
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