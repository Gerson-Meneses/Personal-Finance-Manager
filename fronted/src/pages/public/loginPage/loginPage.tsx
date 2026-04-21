import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLogin } from "../../../features/auth/useLogin";
import { PasswordInput } from "../../../shared/components/PasswordInput/PasswordInput";
import { TextInput } from "../../../shared/components/TextInput/TextInput";
import { handleFieldChange } from "../../../shared/utils/handleFieldChange";
import type { DetailsError } from "../../../shared/dataApiInterface";

interface LoginForm {
    email: string
    password: string
}

const initialForm: LoginForm = {
    email: "",
    password: ""
}

export const LoginPage = () => {
    const navigate = useNavigate()
    const login = useLogin()

    const [formData, setFormData] = useState<LoginForm>(initialForm)
    const [errors, setErrors] = useState<DetailsError<LoginForm> | null>(null)

    useEffect(() => { login.reset() }, [])

    useEffect(() => {
        if (login.error?.details) {
            setErrors(login.error.details as DetailsError<LoginForm>)
        }
    }, [login.error])

    const onChange = <K extends keyof LoginForm>(field: K, value: LoginForm[K]) => {
        handleFieldChange(field, value, setFormData, setErrors)
    }

    const getError = (field: keyof LoginForm) => errors?.[field]?.[0] ?? null

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setErrors(null)
        login.mutate(formData)
    }

    return (
        <form className="form-default-container login-form" onSubmit={handleSubmit}>

            <h1>Iniciar sesión</h1>

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
                    disabled={login.isPending}
                    width="220px"
                />
            </div>

            <div className="form-default-row">
                <PasswordInput
                    name="password"
                    label="Contraseña"
                    value={formData.password}
                    onChange={(val) => onChange("password", val)}
                    error={getError("password")}
                    required
                    disabled={login.isPending}
                />
            </div>

            {login.error && !login.error.details && (
                <div className="error-banner">
                    {login.error.message || "Ocurrió un error inesperado"}
                </div>
            )}

            <button
                className="button-login"
                type="submit"
                disabled={login.isPending}
            >
                {login.isPending ? "Iniciando sesión..." : "Iniciar sesión"}
            </button>

            <p className="button-message" onClick={() => navigate("/register")}>
                ¿No tienes cuenta? <span>Regístrate</span>
            </p>
            <p className="button-message" onClick={() => navigate("/reset-password")}>
                ¿Olvidaste tu contraseña? <span>Recupérala</span>
            </p>
        </form>
    )
}