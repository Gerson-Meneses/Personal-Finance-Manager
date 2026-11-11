import { useState } from "react"
import { useAuthContext } from "../../../features/auth/useAuthContext"
import { useVerifyEmail } from "../../../features/auth/useVerifyAccount"
import { apiFetch } from "../../../shared/api"
import { useToast } from "../../../shared/Hooks/useToast"
import type { User } from "../../../features/auth/types"
import { CodeFlowModal } from "./CodeFlowModal"
import { ProfileDataCard } from "./ProfileDataCard"
import { ProfileSecurityCard } from "./ProfileSecurityCard"
import { Sparkles } from "lucide-react"
import "./profilePage.css"

function getInitials(name: string) {
    return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()
}

export default function ProfilePage() {
    const { user, setUser } = useAuthContext()
    const verify = useVerifyEmail()
    const toast = useToast()

    const [verifyOpen, setVerifyOpen] = useState(false)

    if (!user) return null

    const showToast = (message: string) => toast.success(message)

    const refreshUser = async () => {
        try {
            const fresh = await apiFetch<User>("/user/me")
            setUser(fresh)
        } catch {
            // se mantiene el usuario actual si el refetch falla
        }
    }

    const openVerifyModal = () => {
        verify.request.reset()
        verify.verify.reset()
        setVerifyOpen(true)
    }

    const handleVerifyConfirm = (code: string) => {
        if (!user.email) return
        verify.verify.mutate({ email: user.email, code }, {
            onSuccess: () => {
                setVerifyOpen(false)
                showToast("Correo verificado correctamente")
                void refreshUser()
            },
        })
    }

    return (
        <div className="page-container profile-page">
            <header className="page-header card">
                <div>
                    <h1>Mi perfil</h1>
                    <p className="text-muted">Datos de tu cuenta</p>
                </div>
                <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => window.dispatchEvent(new Event("finance:open-onboarding"))}
                >
                    <Sparkles size={15} />
                    Ver tutorial
                </button>
            </header>

            <section className="card profile-identity-card">
                <div className="profile-avatar">{getInitials(user.name)}</div>
                <div className="profile-identity">
                    <h2>{user.name}</h2>
                    <span className="profile-email">{user.email || "—"}</span>
                    <div className="profile-identity-meta">
                        <span className={`profile-badge ${user.is_verified ? "verified" : "pending"}`}>
                            {user.is_verified ? "Email verificado" : "Email sin verificar"}
                        </span>
                        {!user.is_verified && user.email && (
                            <button type="button" className="profile-action-btn" onClick={openVerifyModal}>
                                Verificar correo
                            </button>
                        )}
                    </div>
                </div>
            </section>

            <ProfileDataCard
                user={user}
                showToast={showToast}
                onUserUpdated={() => void refreshUser()}
            />

            <ProfileSecurityCard
                user={user}
                showToast={showToast}
                onUserUpdated={() => void refreshUser()}
            />

            {verifyOpen && (
                <CodeFlowModal
                    isOpen={verifyOpen}
                    onClose={() => setVerifyOpen(false)}
                    title="Verificar tu correo"
                    description={<>Enviaremos un código de verificación a <strong>{user.email}</strong>.</>}
                    sendMutation={verify.request}
                    confirmMutation={verify.verify}
                    onSend={onSuccess => {
                        if (!user.email) return
                        verify.request.mutate({ email: user.email }, { onSuccess })
                    }}
                    onConfirm={handleVerifyConfirm}
                    confirmLabel="Verificar"
                />
            )}

        </div>
    )
}
