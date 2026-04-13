import { getIcon } from "../../utils/GetIcon";
import './TypeToggle.css';

interface ToggleOption {
    label: string;
    value: string;
    color?: string; // Color cuando esta opción está activa
}

interface TypeToggleProps {
    value: string;
    onChange: (val: string) => void;
    label?: string;
    icon?: string | null;
    disabled?: boolean;
    error?: string | null;
    // Props opcionales para personalizar los botones
    leftOption?: ToggleOption;
    rightOption?: ToggleOption;
}

export const TypeToggle = ({
    value,
    onChange,
    label = "Tipo",
    icon = "ArrowLeftRight",
    disabled = false,
    error,
    // Definimos valores por defecto (Rojo para gasto/débito, Verde para ingreso/crédito)
    leftOption = { label: "Gasto", value: "EXPENSE", color: "#ef4444" },
    rightOption = { label: "Ingreso", value: "INCOME", color: "#22c55e" }
}: TypeToggleProps) => {

    const handleSelect = (val: string) => {
        if (!disabled) onChange(val);
    };

    // Determinamos cuál es la opción activa actual para obtener su color
    const activeOption = value === rightOption.value ? rightOption : leftOption;

    return (
        <div className={`custom-form-group ${error ? 'has-error' : ''} ${disabled ? 'disabled' : ''}`}>
            <label className="input-label">
                {icon && getIcon(icon)} {label}
            </label>

            <div 
                className="toggle-wrapper"
                // Pasamos el color dinámico como variable CSS al contenedor
                style={{ 
                    '--active-color': activeOption.color,
                } as React.CSSProperties}
            >
                {/* ESTE ES EL INDICADOR QUE SE MUEVE (el fondo de color) */}
                <div className={`toggle-slider ${value === rightOption.value ? 'is-right' : 'is-left'}`}></div>

                {/* BOTONES (ahora transparentes, solo contienen el texto) */}
                <button
                    type="button"
                    className={`toggle-button ${value === leftOption.value ? 'active' : ''}`}
                    onClick={() => handleSelect(leftOption.value)}
                    disabled={disabled}
                >
                    {leftOption.label}
                </button>

                <button
                    type="button"
                    className={`toggle-button ${value === rightOption.value ? 'active' : ''}`}
                    onClick={() => handleSelect(rightOption.value)}
                    disabled={disabled}
                >
                    {rightOption.label}
                </button>
            </div>
            
            {error && <span className="error-text">{error}</span>}
        </div>
    );
};