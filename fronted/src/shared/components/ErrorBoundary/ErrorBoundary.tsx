import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import "./ErrorBoundary.css";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false };

    static getDerivedStateFromError(): State {
        return { hasError: true };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error("Error no controlado en la interfaz:", error, info);
    }

    render() {
        if (!this.state.hasError) return this.props.children;

        return (
            <div className="error-boundary">
                <div className="error-boundary__card">
                    <span className="error-boundary__icon">
                        <AlertTriangle size={24} />
                    </span>
                    <h1>Algo salió mal</h1>
                    <p>
                        Ocurrió un error inesperado al mostrar esta vista. Puedes recargar la página o volver al inicio.
                    </p>
                    <div className="error-boundary__actions">
                        <button type="button" className="btn-primary" onClick={() => window.location.reload()}>
                            <RefreshCw size={15} />
                            Recargar
                        </button>
                        <button type="button" className="btn-secondary" onClick={() => window.location.assign("/")}>
                            Ir al inicio
                        </button>
                    </div>
                </div>
            </div>
        );
    }
}
