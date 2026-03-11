import { useState } from "react";
import "./loginPage.css"
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../features/auth/authContext";

export const LoginPage = () => {
    const [email, setName] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState<string | null>(null)
    const navigate = useNavigate()
    const { login } = useAuth()

    const handleFormLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        try {
            await login(email, password)
            navigate('/transactions')

        } catch (error: any) {
            console.log(error.error)
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

                <input
                    id="passwordInput"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Contraseña"
                />
                <span className="errorMessage flecha hidden"></span>

                <button className="cursorPointer" type="submit">Login</button>

                <p className="cursorPointer" onClick={() => navigate("/register")}>¿No tienes cuenta?, Registrate.</p>
                {error && <span id="errorApi" className="errorMessage"> {error} </span>}

            </form>
        </>
    )
}