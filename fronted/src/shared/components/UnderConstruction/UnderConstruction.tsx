import { useNavigate } from "react-router-dom";
import { Construction, Home, ArrowLeft } from "lucide-react";
import './UnderConstruction.css';

export default function UnderConstructionView() {
    const navigate = useNavigate();

    return (
        <div className="construction-container">
            <div className="construction-content">
                <div className="construction-icon">
                    <Construction size={80} strokeWidth={1.5} />
                </div>

                <h1>Próximamente</h1>
                <h2>Estamos construyendo algo nuevo</h2>
                <p>
                    Esta funcionalidad está en pleno desarrollo para ayudarte a gestionar mejor tus finanzas. 
                    ¡Vuelve pronto para ver las novedades!
                </p>

                <div className="construction-actions">
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