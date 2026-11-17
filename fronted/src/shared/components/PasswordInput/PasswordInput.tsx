import { useId, useState } from "react";

import { getIcon } from "../../utils/GetIcon";

import type { BaseInputProps } from "../types";

import "./PasswordInput.css";

interface PasswordInputProps
    extends BaseInputProps<string> {
    placeholder?: string;

    autoComplete?: string;

    icon?: string | null;

    onBlur?: React.FocusEventHandler<HTMLInputElement>;
}

export const PasswordInput = ({
    value = "",

    onChange,

    label = "Contraseña",

    error,

    placeholder = "••••••••",

    required,
    disabled,

    onBlur,

    autoComplete = "current-password",

    icon = "LockKeyhole",

    name,
    id,

    className,
}: PasswordInputProps) => {
    const [show, setShow] = useState(false);
    const generatedId = useId();

    const inputId =
        id ?? name ?? "password-input";
    const errorId = `${generatedId}-error`;

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

            <div
                className={`
          input-wrapper-password
          ${disabled ? "disabled" : ""}
        `}
            >
                <input
                    id={inputId}
                    name={name}
                    type={show ? "text" : "password"}
                    className="input-password"
                    value={value ?? ""}
                    placeholder={placeholder}
                    required={required}
                    disabled={disabled}
                    autoComplete={autoComplete}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? errorId : undefined}
                    onBlur={onBlur}
                    onChange={(e) =>
                        onChange(e.target.value)
                    }
                />

                <button
                    type="button"
                    className="password-toggle-btn tooltip-left"
                    disabled={disabled}
                    aria-label={
                        show
                            ? "Ocultar contraseña"
                            : "Mostrar contraseña"
                    }
                    data-tooltip={
                        show
                            ? "Ocultar contraseña"
                            : "Mostrar contraseña"
                    }
                    onClick={() =>
                        setShow((prev) => !prev)
                    }
                >
                    {show
                        ? getIcon("EyeOff")
                        : getIcon("Eye")}
                </button>
            </div>

            {error && (
                <span id={errorId} className="error-text" role="alert">
                    {error}
                </span>
            )}
        </div>
    );
};