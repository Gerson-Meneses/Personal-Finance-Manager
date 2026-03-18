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
    const [confirmPassword, setConfirmPassword] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const [show, setShow] = useState(false);
    const [coinciden, setCoinciden] = useState(true)
    const { register } = useAuth()
    const navigate = useNavigate()

    const days = Array.from(
        { length: getDaysInMonth(month, year) },
        (_, i) => i + 1
    )

    const years = generateYears()

    const detailsToText = (details: any) => {
        let text = "";
        for (const key in details) {
            text += `${key}:\n`;
            details[key].forEach((item: any) => {
                text += `- ${item}\n`;
            });
        }
        return text;
    }

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
            navigate("/")

        } catch (err: any) {
            if (err?.error?.message === "Errores de validación") {
                console.log(err?.error?.message === "Errores de validación")
                const validationErrors = detailsToText(err.error.details)
                setError(validationErrors)
                return
            } else {
                setError(err.error.message?.toString() || "Error al enviar el formulario")
            }
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <>

            <form onSubmit={handleRegister}
            style={{margin: "10vh"}}
            >
                <h1>Register</h1>

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
                    placeholder="+51 123 456 789"
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
                    onChange={(e) => { setEmail(e.target.value); setIsAdmin(false) }}
                    placeholder="correo@email.com"
                    required
                />

                <label htmlFor="passwordInput">Password:</label>

                <div className="password-field">
                    <input
                        id="passwordInput"
                        type={show ? "text" : "password"}
                        placeholder="*********"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onBlur={() => { setCoinciden(confirmPassword === password) }}
                        required
                    />

                    <button
                        type="button"
                        className="password-toggle"
                        onClick={(e) => { e.preventDefault(); setShow(!show); }}
                    >
                        {show ? "🚫" : "👁️"}
                    </button>
                </div>

                <label htmlFor="passwordInput">Reingrese su contraseña:</label>

                <div className="password-field">
                    <input
                        id="passwordInput"
                        type={show ? "text" : "password"}
                        placeholder="*********"
                        value={confirmPassword}
                        onChange={(e) => { setConfirmPassword(e.target.value); }}
                        onBlur={() => { setCoinciden(confirmPassword === password) }}
                        required
                    />

                    <button
                        type="button"
                        className="password-toggle"
                        onClick={(e) => { e.preventDefault(); setShow(!show); }}
                    >
                        {show ? "🚫" : "👁️"}
                    </button>
                </div>
                {!coinciden && <span className="error">Las contraseñas deben coincidir.</span>}

                <label htmlFor="adminInput">
                    <input
                        className="cursorPointer"
                        id="adminInput"
                        type="checkbox"
                        checked={isAdmin}
                        onChange={(e) => { if (email === "gersonmeneses1612@gmail.com") { setIsAdmin(e.target.checked) } else { alert("Usuario no admitido para ser administrador, por favor contactarse con el administrador."); } }}
                    />
                    Es administrador
                </label>

                {error && <span className="error">{error}</span>}

                <button className="cursorPointer" type="submit" disabled={submitting || !coinciden || !name || !day || !month || !year || !phone || !country || !email || !password || !confirmPassword}>
                    {submitting ? "Registrando..." : "Registrarse"}
                </button>

                <span className="cursorPointer" onClick={() => navigate("/login")} >¿Ya tienes cuenta?; Incia Sesion</span>
            </form>
        </>
    )
}


