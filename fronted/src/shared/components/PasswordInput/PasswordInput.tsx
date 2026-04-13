import { useState } from "react";
import { getIcon } from "../../utils/GetIcon";
import './PasswordInput.css'

interface PasswordInputProps {
    value?: string
    onChange: (val: string) => void;
    name?: string
    label?: string
    error?: string | null
    placeholder?: string
    required?: boolean
    disabled?: boolean
    onBlur?: () => void
    tittle?: string
}

export const PasswordInput = ({
    value = "",
    onChange,
    name = "password",
    label = "Contraseña",
    error,
    placeholder = "••••••••",
    required,
    disabled,
    tittle = "Contraseña",
    onBlur
}: PasswordInputProps) => {
    const [show, setShow] = useState(false);

    return (
        <div className={`custom-form-group ${error ? 'has-error' : ''}`}>

            <label htmlFor={name} className="input-label">
                {getIcon("LockKeyhole")} {label}
            </label>

            <div className={`input-wrapper-password ${disabled ? 'disabled' : ''}`}>
                <input
                    className="input-password"
                    id={name}
                    name={name}
                    type={show ? "text" : "password"}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    required={required}
                    disabled={disabled}
                    onBlur={onBlur}
                    autoComplete={name === "confirmPassword" ? "new-password" : "current-password"}
                    title={tittle}
                />
                <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShow(prev => !prev)}
                    tabIndex={-1}
                    disabled={disabled}
                    aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
                    title={"Mostar " + tittle}
                >
                    {show ? getIcon("EyeOff") : getIcon("Eye")}
                </button>
            </div>

            {error && <span className="error-text">{error}</span>}
        </div>
    );
};