import { useRef, useState } from "react"
import { useNavigate } from "react-router-dom"

import "../publicLayout.css"
import { useResetPassword } from "../../../features/auth/useResetPassword"
import { TextInput } from "../../../shared/components/TextInput/TextInput"
import { PasswordInput } from "../../../shared/components/PasswordInput/PasswordInput"

const CODE_LENGTH = 6

export const ResetPasswordPage = () => {
    const navigate = useNavigate()
    const { request, confirm } = useResetPassword()

    const [step, setStep] = useState<1 | 2>(2)
    const [email, setEmail] = useState("")
    const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""))
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [passwordMatch, setPasswordMatch] = useState(true)
    const inputsRef = useRef<(HTMLInputElement | null)[]>([])

    // ── Step 1: pedir código ──────────────────────────────
    const handleRequestCode = (e: React.FormEvent) => {
        e.preventDefault()
        request.mutate({ email }, {
            onSuccess: () => setStep(2)
        })
    }

    // ── Step 2: OTP handlers ──────────────────────────────
    const handleDigitChange = (index: number, value: string) => {
        const clean = value.replace(/\D/g, "").slice(-1)
        const next = [...digits]
        next[index] = clean
        setDigits(next)
        if (clean && index < CODE_LENGTH - 1) {
            inputsRef.current[index + 1]?.focus()
        }
    }

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === "Backspace" && !digits[index] && index > 0) {
            inputsRef.current[index - 1]?.focus()
        }
    }

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault()
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, CODE_LENGTH)
        const next = Array(CODE_LENGTH).fill("")
        pasted.split("").forEach((char, i) => { next[i] = char })
        setDigits(next)
        inputsRef.current[Math.min(pasted.length, CODE_LENGTH - 1)]?.focus()
    }

    const handleConfirm = (e: React.FormEvent) => {
        e.preventDefault()
        if (newPassword !== confirmPassword) {
            setPasswordMatch(false)
            return
        }
        confirm.mutate(
            { email, code: digits.join(""), newPassword },
            { onSuccess: () => navigate("/login") }
        )
    }

    const isCodeComplete = digits.every(d => d !== "")

    // ── Render ────────────────────────────────────────────
    return (
        <div className="auth-page-container">

            {/* PASO 1 — pedir código */}
            {step === 1 && (
                <form className="auth-card" onSubmit={handleRequestCode}>
                    <div className="auth-icon-wrap">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                            stroke="#f1c40f" strokeWidth="2" strokeLinecap="round">
                            <rect x="3" y="11" width="18" height="11" rx="2"/>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                    </div>

                    <h1 className="auth-title">¿Olvidaste tu contraseña?</h1>
                    <p className="auth-subtitle">
                        Ingresa tu email y te enviaremos un código para restablecerla.
                    </p>

                    <div className="form-default-row" style={{ width: "100%" }}>
                        <TextInput
                            name="email"
                            label="Email"
                            icon="Mail"
                            value={email}
                            onChange={val => { setEmail(val); request.reset() }}
                            placeholder="correo@email.com"
                            required
                            disabled={request.isPending}
                        />
                    </div>

                    {request.isError && (
                        <div className="error-banner">
                            {(request.error as any)?.message || "Ocurrió un error inesperado"}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="button-login"
                        disabled={request.isPending || !email.trim()}
                    >
                        {request.isPending ? "Enviando..." : "Enviar código"}
                    </button>

                    <p className="button-message" onClick={() => navigate("/login")}>
                        ← Volver al inicio de sesión
                    </p>
                </form>
            )}

            {/* PASO 2 — código + nueva contraseña */}
            {step === 2 && (
                <form className="auth-card" onSubmit={handleConfirm}>
                    <div className="auth-icon-wrap">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                            stroke="#f1c40f" strokeWidth="2" strokeLinecap="round">
                            <rect x="3" y="11" width="18" height="11" rx="2"/>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                            <circle cx="12" cy="16" r="1" fill="#f1c40f"/>
                        </svg>
                    </div>

                    <h1 className="auth-title">Nueva contraseña</h1>
                    <p className="auth-subtitle">
                        Ingresa el código enviado a <strong>{email}</strong>{" "}
                        y elige una nueva contraseña.
                    </p>

                    {/* OTP */}
                    <div className="otp-inputs" onPaste={handlePaste}>
                        {digits.map((digit, i) => (
                            <input
                                key={i}
                                ref={el => { inputsRef.current[i] = el }}
                                className={`otp-input ${digit ? "filled" : ""} ${confirm.isError ? "otp-error" : ""}`}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={e => handleDigitChange(i, e.target.value)}
                                onKeyDown={e => handleKeyDown(i, e)}
                                onFocus={e => e.target.select()}
                                disabled={confirm.isPending}
                                autoFocus={i === 0}
                            />
                        ))}
                    </div>

                    {/* Nueva contraseña */}
                    <div className="form-default-row" style={{ width: "100%" }}>
                        <PasswordInput
                            name="newPassword"
                            label="Nueva contraseña"
                            value={newPassword}
                            onChange={val => {
                                setNewPassword(val)
                                setPasswordMatch(val === confirmPassword)
                                confirm.reset()
                            }}
                            error={(confirm.error as any)?.details?.newPassword?.[0] ?? null}
                            required
                            disabled={confirm.isPending}
                        />
                    </div>

                    <div className="form-default-row" style={{ width: "100%" }}>
                        <PasswordInput
                            name="confirmPassword"
                            label="Confirmar contraseña"
                            value={confirmPassword}
                            onChange={val => {
                                setConfirmPassword(val)
                                setPasswordMatch(val === newPassword)
                            }}
                            error={!passwordMatch ? "Las contraseñas no coinciden" : null}
                            required
                            disabled={confirm.isPending}
                        />
                    </div>

                    {/* Requisitos de contraseña */}
                    <ul className="password-rules">
                        {[
                            { test: newPassword.length >= 8 && newPassword.length <= 16, label: "8–16 caracteres" },
                            { test: /[a-z]/.test(newPassword), label: "Una minúscula" },
                            { test: /[A-Z]/.test(newPassword), label: "Una mayúscula" },
                            { test: /\d/.test(newPassword), label: "Un número" },
                            { test: /[!@#$%^&*()_\-+=.]/.test(newPassword), label: "Un símbolo válido (!@#...)" },
                        ].map((rule, i) => (
                            <li key={i} className={`password-rule ${rule.test ? "pass" : ""}`}>
                                <span className="rule-dot" />
                                {rule.label}
                            </li>
                        ))}
                    </ul>

                    {confirm.isError && !(confirm.error as any)?.details && (
                        <div className="error-banner">
                            {(confirm.error as any)?.message || "Código inválido o expirado"}
                        </div>
                    )}

                    {confirm.isSuccess && (
                        <div className="success-banner">
                            ¡Contraseña actualizada! Redirigiendo...
                        </div>
                    )}

                    <button
                        type="submit"
                        className="button-login"
                        disabled={!isCodeComplete || !newPassword || !passwordMatch || confirm.isPending}
                    >
                        {confirm.isPending ? "Actualizando..." : "Actualizar contraseña"}
                    </button>

                    <p className="button-message" onClick={() => {
                        setStep(1)
                        setDigits(Array(CODE_LENGTH).fill(""))
                        confirm.reset()
                    }}>
                        ← Cambiar email
                    </p>

                    <p className="button-message" onClick={() => request.mutate({ email })}>
                        ¿No llegó? <span>Reenviar código</span>
                    </p>
                </form>
            )}
        </div>
    )
}