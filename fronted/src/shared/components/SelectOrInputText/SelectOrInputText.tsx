import { getIcon } from "../../utils/GetIcon";
import './SelectOrInputText.css';
import { useState, useEffect } from "react";

interface SelectInputProps {
    value: string;
    onChange: (val: string) => void;
    options: string[];
    label?: string;
    error?: string | null;
    placeholder?: string;
    icon?: string | null;
    required?: boolean;
    disabled?: boolean;
}

export const SelectInput = ({
    label = "Seleccionar",
    value,
    onChange,
    options = [],
    placeholder = "Escribe un nombre...",
    icon = "User",
    error,
    required,
    disabled
}: SelectInputProps) => {
    // Estado interno para saber si mostramos el input manual
    // Si el valor actual no está en la lista de opciones y no está vacío, empezamos en modo manual
    const [isCustom, setIsCustom] = useState(false);

    useEffect(() => {
        if (value && !options.includes(value) && value !== "") {
            setIsCustom(true);
        }
    }, [options]);

    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        if (val === "custom_option") {
            setIsCustom(true);
            onChange(""); // Limpiamos para que el usuario escriba
        } else {
            onChange(val);
        }
    };

    return (
        <div className={`custom-form-group ${error ? 'has-error' : ''} ${disabled ? 'disabled' : ''}`}>
            <label htmlFor={label} className="input-label">
                {icon && getIcon(icon)}
                {label}
            </label>

            <div className="input-wrapper-select">
                {isCustom || options.length === 0 ? (
                    <div className="custom-input-container">
                        <input
                            id={label}
                            type="text"
                            className="text-input"
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            placeholder={placeholder}
                            required={required}
                            disabled={disabled}
                            autoFocus
                        />
                        {options.length > 0 && (
                            <button 
                                type="button" 
                                className="back-to-list-btn"
                                onClick={() => setIsCustom(false)}
                                title="Volver a la lista"
                            >
                                {getIcon("List")}
                            </button>
                        )}
                    </div>
                ) : (
                    <select
                        id={label}
                        className="custom-select"
                        value={value}
                        onChange={handleSelectChange}
                        required={required}
                        disabled={disabled}
                    >
                        <option value="" disabled hidden>{placeholder}</option>
                        <option value="">-- Selecciona una opción --</option>
                        {options.map((opt) => (
                            <option key={opt} value={opt}>
                                {opt}
                            </option>
                        ))}
                        <option value="custom_option" className="special-option">
                            ➕ Otro (Escribir nombre)
                        </option>
                    </select>
                )}
            </div>
            {error && <span className="error-text">{error}</span>}
        </div>
    );
};