import { getIcon } from "../../utils/GetIcon";

import type { BaseInputProps } from "../types";

import "./TextInput.css";

interface TextInputProps
  extends BaseInputProps<string> {
  placeholder?: string;

  textarea?: boolean;

  icon?: string | null;

  autoResize?: boolean;

  autoSelect?: boolean;

  rows?: number;
}

export const TextInput = ({
  value = "",

  onChange,

  label = "Texto",

  error,

  placeholder = "Ingresar texto",

  textarea = false,

  icon = "Type",

  autoResize = false,

  autoSelect = false,

  rows = 2,

  required,
  disabled,

  name,
  id,

  className,
}: TextInputProps) => {
  const displayValue = value ?? "";

  const inputId =
    id ?? name ?? "text-input";

  const inputWidth = autoResize
    ? displayValue.length > 0
      ? `${Math.max(
          displayValue.length + 2,
          5
        )}ch`
      : "5ch"
    : undefined;

  const handleFocus = (
    e:
      | React.FocusEvent<HTMLInputElement>
      | React.FocusEvent<HTMLTextAreaElement>
  ) => {
    if (autoSelect) {
      e.target.select();
    }
  };

  return (
    <div
      className={`
        custom-form-group
        ${error ? "has-error" : ""}
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

      <div className="input-wrapper">
        {!textarea ? (
          <input
            id={inputId}
            name={name}
            type="text"
            className="input-text"
            value={displayValue}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            style={
              inputWidth
                ? { width: inputWidth }
                : undefined
            }
            onFocus={handleFocus}
            onChange={(e) =>
              onChange(e.target.value)
            }
          />
        ) : (
          <textarea
            id={inputId}
            name={name}
            className="input-arealabel"
            value={displayValue}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            rows={rows}
            onFocus={handleFocus}
            onChange={(e) =>
              onChange(e.target.value)
            }
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