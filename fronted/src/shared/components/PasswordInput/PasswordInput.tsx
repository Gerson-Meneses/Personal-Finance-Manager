import { useState } from "react";

import { getIcon } from "../../utils/GetIcon";

import type { BaseInputProps } from "../types";

import "./PasswordInput.css";

interface PasswordInputProps
    extends BaseInputProps<string> {
    placeholder?: string;

    autoComplete?: string;

    title?: string;

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

    title = "Contraseña",

    icon = "LockKeyhole",

    name,
    id,

    className,
}: PasswordInputProps) => {
    const [show, setShow] = useState(false);

    const inputId =
        id ?? name ?? "password-input";

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
                    value={value}
                    placeholder={placeholder}
                    required={required}
                    disabled={disabled}
                    autoComplete={autoComplete}
                    title={title}
                    onBlur={onBlur}
                    onChange={(e) =>
                        onChange(e.target.value)
                    }
                />

                <button
                    type="button"
                    className="password-toggle-btn"
                    disabled={disabled}
                    aria-label={
                        show
                            ? "Ocultar contraseña"
                            : "Mostrar contraseña"
                    }
                    title={
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
                <span className="error-text">
                    {error}
                </span>
            )}
        </div>
    );
};