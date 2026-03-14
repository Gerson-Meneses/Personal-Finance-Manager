import { useEffect, useState } from "react"
import { useAuth } from "../../../features/auth/authContext"
import { useNavigate } from "react-router-dom"
import { generateYears, getDaysInMonth, months } from "./dateUtils"

export const RegisterPage = () => {

    const [name, setName] = useState("")
    const [day, setDay] = useState("")
    const [month, setMonth] = useState("")
    const [year, setYear] = useState("")
    const [phone, setPhone] = useState("")
    const [country, setCountry] = useState("")
    const [isAdmin, setIsAdmin] = useState(false)
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const { register } = useAuth()
    const navigate = useNavigate()

    const days = Array.from(
        { length: getDaysInMonth(month, year) },
        (_, i) => i + 1
    )

    const years = generateYears()

    useEffect(() => {
        const maxDays = getDaysInMonth(month, year)
        if (Number(day) > maxDays) {
            setDay("")
        }
    }, [month, year])

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setSubmitting(true)

        try {
            await register({
                name,
                birthDate: `${year}-${month}-${day}`,
                phone,
                country,
                isAdmin,
                email,
                password
            })
            navigate("/transactions")

        } catch (err: any) {
            console.log(err)
            setError(err.error.message || "Error al registrar usuario")
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <>
            <h1>Register</h1>

            <form onSubmit={handleRegister}>

                <label htmlFor="nameInput">Nombre:</label>
                <input
                    id="nameInput"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nombre"
                    required
                />

                <label htmlFor="birthdateInput">Fecha de Nacimiento:</label>
                <div style={{ display: "flex", gap: "10px" }}>

                    <select className="cursorPointer" value={day} onChange={(e) => setDay(e.target.value)}>
                        <option value="">Día</option>
                        {days.map(d => (
                            <option key={d} value={String(d).padStart(2, "0")}>
                                {d}
                            </option>
                        ))}
                    </select>

                    <select className="cursorPointer" value={month} onChange={(e) => setMonth(e.target.value)}>
                        <option value="">Mes</option>
                        {months.map(m => (
                            <option key={m.value} value={m.value}>
                                {m.label}
                            </option>
                        ))}
                    </select>

                    <select className="cursorPointer" value={year} onChange={(e) => setYear(e.target.value)}>
                        <option value="">Año</option>
                        {years.map(y => (
                            <option key={y} value={y}>
                                {y}
                            </option>
                        ))}
                    </select>

                </div>

                <label htmlFor="phoneInput">Teléfono:</label>
                <input
                    id="phoneInput"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="999999999"
                    required
                />

                <label htmlFor="countryInput">País:</label>
                <input
                    id="countryInput"
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="Perú"
                    required
                />

                <label htmlFor="emailInput">Email:</label>
                <input
                    id="emailInput"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="correo@email.com"
                    required
                />

                <label htmlFor="passwordInput">Password:</label>
                <input
                    id="passwordInput"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />

                <label htmlFor="adminInput">
                    <input
                        className="cursorPointer"
                        id="adminInput"
                        type="checkbox"
                        checked={isAdmin}
                        onChange={(e) => setIsAdmin(e.target.checked)}
                    />
                    Es administrador
                </label>

                {error && <span className="error">{error}</span>}

                <button className="cursorPointer" type="submit" disabled={submitting}>
                    {submitting ? "Registrando..." : "Registrarse"}
                </button>

            <span className="cursorPointer" onClick={() => navigate("/login")} >¿Ya tienes cuenta?; Incia Sesion</span>
            </form>
        </>
    )
}


