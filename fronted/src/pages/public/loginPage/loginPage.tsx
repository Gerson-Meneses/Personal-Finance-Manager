import { useState } from "react";
import { apiFetch } from "../../../shared/api";
import "./loginPage.css"
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../features/auth/authContext";

export const LoginPage = () => {
    const [email, setName] = useState("")
    const [password, setPassword] = useState("")
    const navigate = useNavigate()
    const { login } = useAuth()

    const handleFormLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const data: { token: string } = await apiFetch("/auth/login", {
                method: "POST",
                body: JSON.stringify({ email, password })
            })
            login(data.token)
            navigate('/transactions')

        } catch (error) {
            console.error("Error logging in:", error)
            const errorSpan = document.getElementById("errorApi")
            if (errorSpan) {
                errorSpan.textContent = "Credenciales incorrectas"
                errorSpan.classList.remove("hidden")
            }
        }
    }

    return (
        <>
            <form className="formLogin" onSubmit={handleFormLogin}>
                <h1>Iniciar Sesion</h1>
                <label htmlFor="emailInput">
                    Email:
                    <input
                        id="emailInput"
                        type="email"
                        value={email}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="example@gmail.com"
                    />
                    <span className="errorMessage flecha hidden"></span>
                </label>
                <label htmlFor="passwordInput">
                    Contraseña:
                    <input
                        id="passwordInput"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="********"
                    />
                    <span className="errorMessage flecha hidden"></span>
                </label>
                <button className="cursorPointer" type="submit">Login</button>

                <p className="cursorPointer" onClick={() => navigate("/register")}>¿No tienes cuenta?, Registrate.</p>
                <span id="errorApi" className="errorMessage hidden"></span>

            </form>
        </>
    )
}