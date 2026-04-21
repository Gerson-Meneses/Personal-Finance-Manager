import { getIcon } from "../../utils/GetIcon";
import './TextInput.css'

interface TextInputProps {
    value?: string
    onChange: (val: string) => void;
    name?: string
    label?: string
    error?: string | null
    placeholder?: string
    textarea?: boolean
    icon?: string
    required?: boolean
    disabled?: boolean
    minWidth?: string
    width?: string
}

export const TextInput = ({
    value = "",
    onChange,
    name = "Texto",
    label = "Nombre",
    error,
    placeholder = "Ingresar Nombre",
    textarea,
    icon = "Type",
    required,
    minWidth = "5ch",
    width,
    disabled
}: TextInputProps) => {
    let inputWidth = value ? `${String(value).length + 2}ch` : minWidth;
    if (width) inputWidth = width
    return (
        <div className={`custom-form-group ${error ? 'has-error' : ''}`}>

            <label htmlFor={name} className="input-label">
                {getIcon(icon)} {label}
            </label>

            <div className="input-wrapper">
                {!textarea ? <input
                    style={{ width: inputWidth }}
                    className="input-text"
                    name={name}
                    id={name}
                    type="text"
                    value={value.length === 0 ? "" : value} // Limpieza visual
                    onChange={(e) => onChange(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    placeholder={placeholder}
                    required={required}
                    disabled={disabled}
                /> : <><textarea
                    className="input-arealabel"
                    name={name}
                    placeholder={placeholder}
                    value={value.length === 0 ? "" : value} // Limpieza visual
                    onChange={(e) => onChange(e.target.value)}
                    rows={2}
                    onFocus={(e) => e.target.select()}
                    required={required}
                    disabled={disabled} /></>}

            </div>
            {error && <span className="error-text">{error}</span>}
        </div>
    )
}