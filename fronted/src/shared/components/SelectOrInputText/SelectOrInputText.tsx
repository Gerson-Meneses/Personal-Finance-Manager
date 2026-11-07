import { useState } from "react";
import { getIcon } from "../../utils/GetIcon";

import type { BaseInputProps } from "../types";
import { SelectInput } from "../SelectInput/SelectInput";

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
            !options.includes(value ?? "")
        );

    const handleChange = (
        selected: string
    ) => {
        if (selected === CUSTOM_OPTION) {
            setIsCustomMode(true);
            onChange("");
            return;
        }

        onChange(selected);
    };

    if (!isCustomMode && options.length > 0) {
        return (
            <SelectInput
                value={value}
                onChange={handleChange}
                label={label}
                icon={icon}
                error={error}
                required={required}
                disabled={disabled}
                id={inputId}
                name={name}
                placeholder="Selecciona una opción"
                options={[
                    ...options.map((opt) => ({
                        value: opt,
                        label: opt,
                    })),
                    {
                        value: CUSTOM_OPTION,
                        label: "+ Otro (escribir nombre)",
                    },
                ]}
                className={className ?? ""}
            />
        );
    }

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
                <div className="custom-input-container">
                    <input
                        id={inputId}
                        name={name}
                        type="text"
                        className="text-input"
                        value={value ?? ""}
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
                            className="back-to-list-btn tooltip-left"
                            aria-label="Volver a la lista"
                            data-tooltip="Volver a la lista"
                            disabled={disabled}
                            onClick={() => setIsCustomMode(false)}
                        >
                            {getIcon("List")}
                        </button>
                    )}
                </div>
            </div>

            {error && (
                <span className="error-text">
                    {error}
                </span>
            )}
        </div>
    );
}
