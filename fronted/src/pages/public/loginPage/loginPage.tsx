import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../features/auth/authContext";

export const LoginPage = () => {
    const [email, setName] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [show, setShow] = useState(false);
    const navigate = useNavigate()
    const { login } = useAuth()

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

    const handleFormLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        try {
            await login(email, password)
            navigate('/')

        } catch (error: any) {
            if (error?.error?.message === "Errores de validación") {
                const validationErrors = detailsToText(error.error.details)
                setError(validationErrors)
                return
            }
            setError(error.error.message)
        }
    }

    return (
        <>
            <form className="formLogin" onSubmit={handleFormLogin}>
                <h1>Iniciar Sesion</h1>

                <input
                    id="emailInput"
                    type="email"
                    value={email}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Email"
                />
                <span className="errorMessage flecha hidden"></span>

                <div className="password-field">
                    <input
                        id="passwordInput"
                        type={show ? "text" : "password"}
                        placeholder="*********"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
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
                <span className="errorMessage flecha hidden"></span>

                <button disabled={!password||!email} className="cursorPointer" type="submit">Login</button>

                <p className="cursorPointer" onClick={() => navigate("/register")}>¿No tienes cuenta?, Registrate.</p>
                {error && <span id="errorApi" className="errorMessage"> {error} </span>}

            </form>
        </>
    )
}