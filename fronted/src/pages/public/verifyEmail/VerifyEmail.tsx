import { useRef, useState } from "react"
import { useNavigate } from "react-router-dom"

import "../publicLayout.css"
import { useVerifyEmail } from "../../../features/auth/useVerifyAccount"
import { TextInput } from "../../../shared/components/TextInput/TextInput"

const CODE_LENGTH = 6

export const VerifyEmailPage = () => {
    const navigate = useNavigate()
    const { request, verify } = useVerifyEmail()

    const [step, setStep] = useState<1 | 2>(1)
    const [email, setEmail] = useState("")
    const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""))
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

    const handleVerifyCode = (e: React.FormEvent) => {
        e.preventDefault()
        verify.mutate(
            { email, code: digits.join("") },
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
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                            <polyline points="22,6 12,13 2,6"/>
                        </svg>
                    </div>

                    <h1 className="auth-title">Verifica tu email</h1>
                    <p className="auth-subtitle">
                        Te enviaremos un código de verificación a tu correo.
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

            {/* PASO 2 — ingresar código */}
            {step === 2 && (
                <form className="auth-card" onSubmit={handleVerifyCode}>
                    <div className="auth-icon-wrap">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                            stroke="#f1c40f" strokeWidth="2" strokeLinecap="round">
                            <rect x="2" y="6" width="20" height="12" rx="2"/>
                            <path d="M8 12h8M12 9v6"/>
                        </svg>
                    </div>

                    <h1 className="auth-title">Ingresa el código</h1>
                    <p className="auth-subtitle">
                        Enviamos un código de 6 dígitos a<br />
                        <strong>{email}</strong>
                    </p>

                    <div className="otp-inputs" onPaste={handlePaste}>
                        {digits.map((digit, i) => (
                            <input
                                key={i}
                                ref={el => { inputsRef.current[i] = el }}
                                className={`otp-input ${digit ? "filled" : ""} ${verify.isError ? "otp-error" : ""}`}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={e => handleDigitChange(i, e.target.value)}
                                onKeyDown={e => handleKeyDown(i, e)}
                                onFocus={e => e.target.select()}
                                disabled={verify.isPending}
                                autoFocus={i === 0}
                            />
                        ))}
                    </div>

                    {verify.isError && (
                        <div className="error-banner">
                            {(verify.error as any)?.message || "Código inválido o expirado"}
                        </div>
                    )}

                    {verify.isSuccess && (
                        <div className="success-banner">
                            ¡Email verificado! Redirigiendo...
                        </div>
                    )}

                    <button
                        type="submit"
                        className="button-login"
                        disabled={!isCodeComplete || verify.isPending}
                    >
                        {verify.isPending ? "Verificando..." : "Verificar"}
                    </button>

                    <p className="button-message" onClick={() => {
                        setStep(1)
                        setDigits(Array(CODE_LENGTH).fill(""))
                        verify.reset()
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