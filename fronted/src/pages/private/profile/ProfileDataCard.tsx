import { useState } from "react"
import dayjs from "dayjs"
import { TextInput } from "../../../shared/components/TextInput/TextInput"
import { BirthDateInput } from "../../../shared/components/BirthDateInput/BithrDateInput"
import { useUpdateProfile } from "../../../features/auth/useProfile"
import { UpdateProfileSchema, type UpdateProfileOutput, type User } from "../../../features/auth/types"
import type { DetailsError } from "../../../shared/dataApiInterface"

interface Props {
    user: User
    showToast: (message: string) => void
    onUserUpdated: () => void
}

interface FormBirthDate {
    day: string
    month: string
    year: string
}

interface FormData {
    name: string
    phone: string
    country: string
    birthDate: FormBirthDate
}

const FIELD_LABELS: Record<keyof UpdateProfileOutput, string> = {
    name: "Nombre",
    phone: "Teléfono",
    country: "País",
    birthDate: "Fecha de nacimiento",
}

function toForm(user: User): FormData {
    const d = dayjs(user.birthDate)
    return {
        name: user.name,
        phone: String(user.phone ?? ""),
        country: user.country ?? "",
        birthDate: d.isValid()
            ? { day: d.format("DD"), month: d.format("MM"), year: d.format("YYYY") }
            : { day: "", month: "", year: "" },
    }
}

function birthDateToString(birthDate: FormBirthDate): string {
    return `${birthDate.year}-${birthDate.month}-${birthDate.day}`
}

export function ProfileDataCard({ user, showToast, onUserUpdated }: Props) {
    const update = useUpdateProfile()

    const [editing, setEditing] = useState(false)
    const [form, setForm] = useState<FormData>(() => toForm(user))
    const [errors, setErrors] = useState<DetailsError<UpdateProfileOutput> | null>(null)

    const todayBirthDate = birthDateToString(form.birthDate)
    const todayBirthDateRef = dayjs(user.birthDate).format("YYYY-MM-DD")

    const rawPayload: UpdateProfileOutput = {}
    if (form.name.trim() !== user.name) rawPayload.name = form.name.trim()
    if (form.phone !== String(user.phone ?? "")) rawPayload.phone = form.phone
    if (form.country.trim() !== (user.country ?? "")) rawPayload.country = form.country.trim()
    if (todayBirthDate !== todayBirthDateRef) rawPayload.birthDate = todayBirthDate

    const isDirty = Object.keys(rawPayload).length > 0

    const getError = (field: keyof UpdateProfileOutput): string | null =>
        errors?.[field]?.[0] ?? update.error?.details?.[field]?.[0] ?? null

    const clearFieldError = () => {
        setErrors(null)
        if (update.isError) update.reset()
    }

    const startEditing = () => {
        setForm(toForm(user))
        setErrors(null)
        update.reset()
        setEditing(true)
    }

    const cancelEditing = () => {
        setForm(toForm(user))
        setErrors(null)
        update.reset()
        setEditing(false)
    }

    /* Guardar directo: no pide confirmación (no es destructivo). El aviso
       de éxito llega como toast y el formulario se cierra solo. */
    const handleSaveClick = () => {
        const parsed = UpdateProfileSchema.safeParse(rawPayload)
        if (!parsed.success) {
            const details: DetailsError<UpdateProfileOutput> = {}
            for (const issue of parsed.error.issues) {
                const key = issue.path[0]
                if (typeof key === "string" && key in FIELD_LABELS) {
                    const field = key as keyof UpdateProfileOutput
                    if (!details[field]) details[field] = [issue.message]
                }
            }
            setErrors(details)
            return
        }
        setErrors(null)
        update.mutate(parsed.data, {
            onSuccess: () => {
                setEditing(false)
                setErrors(null)
                showToast("Perfil actualizado")
                onUserUpdated()
            },
        })
    }

    const viewRows: { label: string; value: string }[] = [
        { label: "Teléfono", value: String(user.phone ?? "—") },
        { label: "País", value: user.country || "—" },
        { label: "Fecha de nacimiento", value: user.birthDate ? dayjs(user.birthDate).format("DD/MM/YYYY") : "—" },
        { label: "Miembro desde", value: dayjs(user.createdAt).format("DD/MM/YYYY") },
        { label: "Cuentas", value: String(user.accounts?.length ?? 0) },
        { label: "Categorías", value: String(user.categories?.length ?? 0) },
    ]

    return (
        <section className="card profile-details">
            <div className="profile-card-header">
                <h3>Datos personales</h3>
                {!editing && (
                    <button type="button" className="profile-action-btn" onClick={startEditing}>
                        Editar
                    </button>
                )}
            </div>

            {!editing && viewRows.map(row => (
                <div key={row.label} className="profile-row">
                    <span className="profile-row-label">{row.label}</span>
                    <span className="profile-row-value">{row.value}</span>
                </div>
            ))}

            {editing && (
                <div className="profile-edit-form">
                    <div className="form-default-row">
                        <TextInput
                            name="name"
                            label="Nombre"
                            icon="User"
                            value={form.name}
                            onChange={val => { setForm(prev => ({ ...prev, name: val })); clearFieldError() }}
                            error={getError("name")}
                            placeholder="Tu nombre"
                            required
                            disabled={update.isPending}
                        />
                    </div>

                    <div className="form-default-row">
                        <BirthDateInput
                            value={form.birthDate}
                            onChange={val => { setForm(prev => ({ ...prev, birthDate: val })); clearFieldError() }}
                            error={getError("birthDate")}
                            disabled={update.isPending}
                            required
                        />
                    </div>

                    <div className="form-default-row">
                        <TextInput
                            name="phone"
                            label="Teléfono"
                            icon="Phone"
                            value={form.phone}
                            onChange={val => { setForm(prev => ({ ...prev, phone: val })); clearFieldError() }}
                            error={getError("phone")}
                            placeholder="123456789"
                            required
                            disabled={update.isPending}
                        />
                        <TextInput
                            name="country"
                            label="País"
                            icon="MapPin"
                            value={form.country}
                            onChange={val => { setForm(prev => ({ ...prev, country: val })); clearFieldError() }}
                            error={getError("country")}
                            placeholder="Perú"
                            disabled={update.isPending}
                        />
                    </div>

                    {update.isError && !update.error?.details && (
                        <div className="error-banner">
                            {update.error?.message || "Ocurrió un error inesperado"}
                        </div>
                    )}

                    <div className="profile-edit-actions">
                        <button
                            type="button"
                            className="profile-secondary-btn"
                            onClick={cancelEditing}
                            disabled={update.isPending}
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            className="profile-action-btn solid"
                            onClick={handleSaveClick}
                            disabled={update.isPending || !isDirty}
                        >
                            {update.isPending ? "Guardando..." : "Guardar cambios"}
                        </button>
                    </div>
                </div>
            )}
        </section>
    )
}
