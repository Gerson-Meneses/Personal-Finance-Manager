import { useState } from "react";
import { getIcon } from "../../utils/GetIcon";

import type { BaseInputProps } from "../types";

import "./SelectOrInputText.css";

const CUSTOM_OPTION = "__custom__";

interface SelectInputProps
    extends BaseInputProps<string> {
    options: string[];

    placeholder?: string;

    icon?: string | null;
}

export const SelectOrInputText = ({
    value = "",

    onChange,

    options = [],

    label = "Seleccionar",

    error,

    placeholder = "Escribe un nombre...",

    icon = "User",

    required,
    disabled,

    name,
    id,

    className,
}: SelectInputProps) => {
    const inputId =
        id ?? name ?? "select-input";

    const [isCustomMode, setIsCustomMode] =
        useState(
            value !== "" &&
            !options.includes(value)
        );

    const handleSelectChange = (
        e: React.ChangeEvent<HTMLSelectElement>
    ) => {
        const val = e.target.value;

        if (val === CUSTOM_OPTION) {
            setIsCustomMode(true);
            onChange("");
            return;
        }

        onChange(val);
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
                    htmlFor={inputId}
                    className="input-label"
                >
                    {icon && getIcon(icon)}
                    {label}
                </label>
            )}

            <div className="input-wrapper-select">
                {isCustomMode || options.length === 0 ? (
                    <div className="custom-input-container">
                        <input
                            id={inputId}
                            name={name}
                            type="text"
                            className="text-input"
                            value={value}
                            disabled={disabled}
                            required={required}
                            placeholder={placeholder}
                            onChange={(e) =>
                                onChange(e.target.value)
                            }
                        />

                        {options.length > 0 && (
                            <button
                                type="button"
                                className="back-to-list-btn"
                                title="Volver a la lista"
                                disabled={disabled}
                                onClick={() => setIsCustomMode(false)}
                            >
                                {getIcon("List")}
                            </button>
                        )}
                    </div>
                ) : (
                    <select
                        id={inputId}
                        name={name}
                        className="custom-select"
                        value={value}
                        disabled={disabled}
                        required={required}
                        onChange={handleSelectChange}
                    >
                        <option value="">
                            -- Selecciona una opción --
                        </option>

                        {options.map((opt) => (
                            <option
                                key={opt}
                                value={opt}
                            >
                                {opt}
                            </option>
                        ))}

                        <option value={CUSTOM_OPTION}>
                            ➕ Otro (Escribir nombre)
                        </option>
                    </select>
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