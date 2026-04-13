import { getIcon } from "../../utils/GetIcon";
import './ColorPicker.css';

interface ColorPickerProps {
    value?: string;
    onChange: (val: string) => void;
    label?: string;
    icon?: string;
    error?: string | null
    required?: boolean
    disabled?: boolean
}

export const ColorPicker = ({
    value = "#000000",
    onChange,
    label = "Color",
    icon = "Palette",
    error,
    required,
    disabled
}: ColorPickerProps) => {
    return (
        <div className={`custom-form-group ${error ? 'has-error' : ''} ${disabled ? 'disabled' : ''}`}>
            <label className="input-label">
                {getIcon(icon)} {label}
            </label>
            <div className="color-wrapper">
                <input
                    type="color"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="color-input-hidden"
                    required={required}
                    disabled={disabled}
                />
                <div className="color-preview-container">
                    <div className="color-circle" style={{ backgroundColor: value }} />
                    <span className="color-hex">{value.toUpperCase()}</span>
                </div>
                {error && <span className="error-text">{error}</span>}
            </div>
        </div>
    );
};