import { useState } from "react"
import { TextInput } from "../../../shared/components/TextInput/TextInput"
import { PasswordInput } from "../../../shared/components/PasswordInput/PasswordInput"
import { CodeFlowModal } from "./CodeFlowModal"
import { useChangeEmail, useChangePassword } from "../../../features/auth/useProfile"
import { ChangeEmailSchema, ChangePasswordSchema, type User } from "../../../features/auth/types"

interface Props {
    user: User
    showToast: (message: string) => void
    onUserUpdated: () => void
}

const PASSWORD_RULES = [
    { test: (v: string) => v.length >= 8 && v.length <= 16, label: "8–16 caracteres" },
    { test: (v: string) => /[a-z]/.test(v), label: "Una minúscula" },
    { test: (v: string) => /[A-Z]/.test(v), label: "Una mayúscula" },
    { test: (v: string) => /\d/.test(v), label: "Un número" },
    { test: (v: string) => /[!@#$%^&*()_\-+=.]/.test(v), label: "Un símbolo válido (!@#...)" },
]

export function ProfileSecurityCard({ user, showToast, onUserUpdated }: Props) {
    const changeEmail = useChangeEmail()
    const changePassword = useChangePassword()

    const [emailOpen, setEmailOpen] = useState(false)
    const [passwordOpen, setPasswordOpen] = useState(false)

    const [newEmail, setNewEmail] = useState("")
    const [newEmailError, setNewEmailError] = useState<string | null>(null)

    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [newPasswordError, setNewPasswordError] = useState<string | null>(null)
    const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null)

    const openEmailModal = () => {
        changeEmail.request.reset()
        changeEmail.confirm.reset()
        setNewEmail("")
        setNewEmailError(null)
        setEmailOpen(true)
    }

    const openPasswordModal = () => {
        changePassword.request.reset()
        changePassword.confirm.reset()
        setNewPassword("")
        setConfirmPassword("")
        setNewPasswordError(null)
        setConfirmPasswordError(null)
        setPasswordOpen(true)
    }

    const handleEmailConfirm = (code: string) => {
        const parsed = ChangeEmailSchema.safeParse({ code, newEmail })
        if (!parsed.success) {
            const issue = parsed.error.issues.find(i => i.path[0] === "newEmail")
            setNewEmailError(issue?.message ?? "El correo no tiene un formato válido")
            return
        }
        setNewEmailError(null)
        changeEmail.confirm.mutate(parsed.data, {
            onSuccess: () => {
                setEmailOpen(false)
                setNewEmail("")
                showToast("Correo actualizado correctamente")
                onUserUpdated()
            },
        })
    }

    const handlePasswordConfirm = (code: string) => {
        if (newPassword !== confirmPassword) {
            setConfirmPasswordError("Las contraseñas deben coincidir")
            return
        }
        const parsed = ChangePasswordSchema.safeParse({ code, newPassword })
        if (!parsed.success) {
            const issue = parsed.error.issues.find(i => i.path[0] === "newPassword")
            setNewPasswordError(issue?.message ?? "La contraseña no cumple los requisitos")
            return
        }
        setNewPasswordError(null)
        changePassword.confirm.mutate(parsed.data, {
            onSuccess: () => {
                setPasswordOpen(false)
                setNewPassword("")
                setConfirmPassword("")
                showToast("Contraseña actualizada correctamente")
            },
        })
    }

    return (
        <section className="card profile-details">
            <div className="profile-card-header">
                <h3>Seguridad</h3>
            </div>

            <div className="profile-row">
                <span className="profile-row-label">Correo electrónico</span>
                <div className="profile-row-action">
                    <span className="profile-row-value">{user.email || "—"}</span>
                    <button type="button" className="profile-action-btn" onClick={openEmailModal}>
                        Cambiar
                    </button>
                </div>
            </div>

            <div className="profile-row">
                <span className="profile-row-label">Contraseña</span>
                <div className="profile-row-action">
                    <span className="profile-row-value">••••••••</span>
                    <button type="button" className="profile-action-btn" onClick={openPasswordModal}>
                        Cambiar
                    </button>
                </div>
            </div>

            {emailOpen && (
                <CodeFlowModal
                    isOpen={emailOpen}
                    onClose={() => setEmailOpen(false)}
                    title="Cambiar correo"
                    description={<>Enviaremos un código de 6 dígitos a <strong>{user.email}</strong> para confirmar el cambio.</>}
                    sendMutation={changeEmail.request}
                    confirmMutation={changeEmail.confirm}
                    onSend={onSuccess => changeEmail.request.mutate(undefined, { onSuccess })}
                    onConfirm={handleEmailConfirm}
                    confirmLabel="Cambiar correo"
                    extraFields={
                        <TextInput
                            name="newEmail"
                            label="Nuevo correo"
                            icon="Mail"
                            value={newEmail}
                            onChange={val => { setNewEmail(val); setNewEmailError(null) }}
                            error={newEmailError}
                            placeholder="correo@email.com"
                            required
                            disabled={changeEmail.confirm.isPending}
                        />
                    }
                />
            )}

            {passwordOpen && (
                <CodeFlowModal
                    isOpen={passwordOpen}
                    onClose={() => setPasswordOpen(false)}
                    title="Cambiar contraseña"
                    description={<>Enviaremos un código de 6 dígitos a <strong>{user.email}</strong> para confirmar el cambio.</>}
                    sendMutation={changePassword.request}
                    confirmMutation={changePassword.confirm}
                    onSend={onSuccess => changePassword.request.mutate(undefined, { onSuccess })}
                    onConfirm={handlePasswordConfirm}
                    confirmLabel="Cambiar contraseña"
                    extraFields={
                        <>
                            <PasswordInput
                                name="newPassword"
                                label="Nueva contraseña"
                                value={newPassword}
                                onChange={val => { setNewPassword(val); setNewPasswordError(null) }}
                                error={newPasswordError}
                                autoComplete="new-password"
                                required
                                disabled={changePassword.confirm.isPending}
                            />
                            <PasswordInput
                                name="confirmPassword"
                                label="Confirmar contraseña"
                                value={confirmPassword}
                                onChange={val => { setConfirmPassword(val); setConfirmPasswordError(null) }}
                                error={confirmPasswordError}
                                autoComplete="new-password"
                                required
                                disabled={changePassword.confirm.isPending}
                            />
                            <ul className="profile-password-rules">
                                {PASSWORD_RULES.map((rule, i) => (
                                    <li key={i} className={`password-rule ${rule.test(newPassword) ? "pass" : ""}`}>
                                        <span className="rule-dot" />
                                        {rule.label}
                                    </li>
                                ))}
                            </ul>
                        </>
                    }
                />
            )}
        </section>
    )
}
