import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import type { RegisterDTO } from "../../../features/auth/types"
import { useRegister } from "../../../features/auth/useRegister"
import { PasswordInput } from "../../../shared/components/PasswordInput/PasswordInput"
import { BirthDateInput } from "../../../shared/components/BirthDateInput/BithrDateInput"
import { TextInput } from "../../../shared/components/TextInput/TextInput"
import { handleFieldChange } from "../../../shared/utils/handleFieldChange"
import type { DetailsError } from "../../../shared/dataApiInterface"

const ADMIN_EMAIL = "gersonmeneses1612@gmail.com"

const initialForm: Omit<RegisterDTO, "birthDate"> = {
    name: "",
    phone: "",
    country: "",
    isAdmin: false,
    email: "",
    password: "",
}

export const RegisterPage = () => {
    const navigate = useNavigate()
    const register = useRegister()

    const [formData, setFormData] = useState(initialForm)
    const [birthDate, setBirthDate] = useState({ day: "", month: "", year: "" })
    const [confirmPassword, setConfirmPassword] = useState("")
    const [passwordMatch, setPasswordMatch] = useState(true)
    const [errors, setErrors] = useState<DetailsError<RegisterDTO> | null>(null)

    // Sincroniza errores del servidor con el estado local
    useEffect(() => {
        if (register.error?.details) {
            setErrors(register.error.details as DetailsError<RegisterDTO>)
        }
    }, [register.error])

    // Limpia errores al montar
    useEffect(() => {
        register.reset()
    }, [])

    const onChange = <K extends keyof typeof formData>(field: K, value: (typeof formData)[K]) => {
        handleFieldChange(field, value, setFormData, setErrors)
        // Si cambia el email, quitar admin automáticamente
        if (field === "email") {
            setFormData(prev => ({ ...prev, isAdmin: false }))
        }
    }

    const getError = (field: keyof RegisterDTO) => errors?.[field]?.[0] ?? null

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setErrors(null)

        if (formData.password !== confirmPassword) {
            setPasswordMatch(false)
            return
        }

        setPasswordMatch(true)

        register.mutate({
            ...formData,
            birthDate: `${birthDate.year}-${birthDate.month}-${birthDate.day}`
        })
    }

    return (
        <form
            className="form-default-container login-form"
            onSubmit={handleSubmit}
            style={{ margin: "10vh" }}
        >
            <div className="form-default-row">
                <h1>Registro</h1>
            </div>

            {/* antes de Nombre */}
            <p className="form-section-label">Información personal</p>


            {/* Nombre */}
            <div className="form-default-row">
                <TextInput
                    name="name"
                    label="Nombre"
                    icon="User"
                    value={formData.name}
                    onChange={(val) => onChange("name", val)}
                    error={getError("name")}
                    placeholder="Tu nombre"
                    required
                    disabled={register.isPending}
                />
            </div>

            {/* Fecha de nacimiento */}
            <div className="form-default-row">
                <BirthDateInput
                    value={birthDate}
                    onChange={setBirthDate}
                    error={getError("birthDate")}
                    disabled={register.isPending}
                    required
                />
            </div>

            {/* Teléfono y País */}
            <div className="form-default-row">
                <TextInput
                    name="phone"
                    label="Teléfono"
                    icon="Phone"
                    value={formData.phone}
                    onChange={(val) => onChange("phone", val)}
                    error={getError("phone")}
                    placeholder="123 456 789"
                    required
                    disabled={register.isPending}
                />
                <TextInput
                    name="country"
                    label="País"
                    icon="MapPin"
                    value={formData.country}
                    onChange={(val) => onChange("country", val)}
                    error={getError("country")}
                    placeholder="Perú"
                    required
                    disabled={register.isPending}
                />
            </div>

            {/* antes del Email */}
            <div className="form-section-divider" />
            <p className="form-section-label">Cuenta</p>

            {/* Email */}
            <div className="form-default-row">
                <TextInput
                    name="email"
                    label="Email"
                    icon="Mail"
                    value={formData.email}
                    onChange={(val) => onChange("email", val)}
                    error={getError("email")}
                    placeholder="correo@email.com"
                    required
                    width="300px"
                    disabled={register.isPending}
                />
            </div>

            {/* Contraseñas */}
            <div className="form-default-row">
                <PasswordInput
                    name="password"
                    label="Contraseña"
                    value={formData.password}
                    onChange={(val) => onChange("password", val)}
                    onBlur={() => setPasswordMatch(confirmPassword === formData.password)}
                    error={getError("password")}
                    required
                    disabled={register.isPending}
                />
            </div>
            <div className="form-default-row">
                <PasswordInput
                    name="confirmPassword"
                    label="Confirmar contraseña"
                    value={confirmPassword}
                    onChange={(val) => {
                        setConfirmPassword(val)
                        setPasswordMatch(val === formData.password)
                    }}
                    error={!passwordMatch ? "Las contraseñas deben coincidir" : null}
                    required
                    disabled={register.isPending}
                />

            </div>
            <div className="form-default-row">

                {/* Requisitos de contraseña */}
                <ul className="password-rules">
                    {[
                        { test: formData.password.length >= 8 && formData.password.length <= 16, label: "8–16 caracteres" },
                        { test: /[a-z]/.test(formData.password), label: "Una minúscula" },
                        { test: /[A-Z]/.test(formData.password), label: "Una mayúscula" },
                        { test: /\d/.test(formData.password), label: "Un número" },
                        { test: /[!@#$%^&*()_\-+=.]/.test(formData.password), label: "Un símbolo válido (!@#...)" },
                    ].map((rule, i) => (
                        <li key={i} className={`password-rule ${rule.test ? "pass" : ""}`}>
                            <span className="rule-dot" />
                            {rule.label}
                        </li>
                    ))}
                </ul>
            </div>

            {/* Admin (solo visible si el email coincide) */}
            {formData.email === ADMIN_EMAIL && (
                <div className="form-default-row">
                    <label className="input-label" style={{ cursor: "pointer" }}>
                        <input
                            type="checkbox"
                            checked={formData.isAdmin}
                            onChange={(e) =>
                                setFormData(prev => ({ ...prev, isAdmin: e.target.checked }))
                            }
                            disabled={register.isPending}
                        />
                        Es administrador
                    </label>
                </div>
            )}

            {/* Error general del servidor (sin details) */}
            {register.error && !register.error.details && (
                <div className="error-banner">
                    {register.error.message || "Ocurrió un error inesperado"}
                </div>
            )}

            <button
                className="button-login"
                type="submit"
                disabled={register.isPending || !passwordMatch}
            >
                {register.isPending ? "Registrando..." : "Registrarse"}
            </button>

            <p className="button-message" onClick={() => navigate("/login")}>
                ¿Ya tienes cuenta? <span>Inicia sesión</span>
            </p>
        </form>
    )
}