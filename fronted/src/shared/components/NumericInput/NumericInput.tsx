import { getIcon } from "../../utils/GetIcon";
import './NumericInput.css'

interface NumericInputProps {
    value?: number;
    onChange: (val: number) => void;
    label?: string;
    error?: string | null
    placeholder?: string;
    symbol?: string
    icon?: string | null,
    min?: number
    required?: boolean
    disabled?: boolean
}

export const NumericInput = ({
    label = "Número",
    value = 0,
    onChange,
    placeholder = "0.00",
    symbol,
    required,
    min,
    icon = "Hash",
    error,
    disabled
}: NumericInputProps) => {
    const inputWidth = value ? `${String(value).length + 2}ch` : '5ch';
    return (
        <div className={`custom-form-group ${error ? 'has-error' : ''} ${disabled ? 'disabled' : ''}`}>
            <label htmlFor={label} className="input-label">
                {icon && getIcon(icon)}{label}
            </label>
            <div className="input-wrapper-num">
                {symbol && <span className="symbol" >{symbol}</span>}
                <input
                    id={label}
                    name={label}
                    style={{ width: inputWidth }}
                    type="number"
                    step="0.01"
                    className="numeric-input"
                    value={value === 0 ? "" : value} // Limpieza visual
                    onChange={(e) => onChange(Number(e.target.value))}
                    onFocus={(e) => e.target.select()}
                    placeholder={placeholder}
                    required={required}
                    disabled={disabled}
                    min={min}
                />
                {error && <span className="error-text">{error}</span>}
            </div>
        </div >
    );
};