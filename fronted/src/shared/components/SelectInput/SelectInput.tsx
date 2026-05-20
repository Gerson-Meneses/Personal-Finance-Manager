
import type { BaseInputProps } from "../types";
import { getIcon } from "../../utils/GetIcon";
import "./SelectInput.css";
import "../../../index.css"

interface Options {
    value: string;
    label: string
}

interface SelectAccountProps
    extends BaseInputProps<string> {
    placeholder?: string;
    icon?: string | null;
    defaultStyle?: boolean;
    options: Options[]
}

export const SelectInput = ({
    value = "",
    onChange,
    placeholder = "Selecciona una opción",
    label = "Opción",
    icon = "LucideSquareMousePointer",
    error,
    required,
    disabled,
    defaultStyle = true,
    id,
    options,
    name,
    className,
}: SelectAccountProps) => {

    const inputId = id

    const handleSelectChange = (
        e: React.ChangeEvent<HTMLSelectElement>
    ) => {
        const selected = e.target.value;
        onChange(selected);
    };
    return (
        <>
            <div
                className={`
          ${defaultStyle ? "custom-form-group" : ""}
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
                <div className={`${defaultStyle ? "input-wrapper" : ""}`}>
                    <select
                        id={inputId}
                        name={name}
                        value={value}
                        onChange={
                            handleSelectChange
                        }
                        required={required}
                        disabled={disabled}

                    >
                        <option value="">
                            {placeholder}
                        </option>
                        {options && options.map(op => <option value={op.value}>{op.label}</option>)}
                    </select>
                </div>
                {error && (
                    <span className="error-text">
                        {error}
                    </span>
                )}
            </div>
        </>
    );
};