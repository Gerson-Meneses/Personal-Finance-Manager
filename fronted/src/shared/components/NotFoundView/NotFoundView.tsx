import { useNavigate } from "react-router-dom";
import { FileQuestion, Home, ArrowLeft } from "lucide-react";
import './NotFoundView.css'

export default function NotFoundView() {
    const navigate = useNavigate();

    return (
        <div className="not-found-container">
            <div className="not-found-content">
                <div className="not-found-icon">
                    <FileQuestion size={80} strokeWidth={1.5} />
                </div>

                <h1>404</h1>
                <h2>¡Ups! Página no encontrada</h2>
                <p>
                    Parece que la ruta que buscas no existe o fue movida a otra sección de tus finanzas.
                </p>

                <div className="not-found-actions">
                    <button onClick={() => navigate(-1)} className="btn-outline">
                        <ArrowLeft size={18} />
                        Volver atrás
                    </button>

                    <button onClick={() => navigate("/")} className="btn-primary">
                        <Home size={18} />
                        Ir al Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
} 