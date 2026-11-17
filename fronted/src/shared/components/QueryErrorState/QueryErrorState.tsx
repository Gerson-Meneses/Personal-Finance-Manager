import { AlertTriangle, RefreshCw } from "lucide-react";
import "./QueryErrorState.css";

interface QueryErrorStateProps {
    title?: string;
    error?: unknown;
    onRetry: () => void;
    retrying?: boolean;
}

function getErrorMessage(error: unknown) {
    if (error instanceof Error && error.message) return error.message;
    if (typeof error === "string" && error) return error;
    return "Error inesperado";
}

export function QueryErrorState({
    title = "No se pudieron cargar los datos",
    error,
    onRetry,
    retrying = false,
}: QueryErrorStateProps) {
    return (
        <div className="card query-error-state" role="alert">
            <span className="query-error-state__icon" aria-hidden="true">
                <AlertTriangle size={22} />
            </span>
            <h2>{title}</h2>
            <p className="text-muted">{getErrorMessage(error)}</p>
            <button type="button" className="btn-primary" onClick={onRetry} disabled={retrying}>
                <RefreshCw size={16} />
                {retrying ? "Reintentando..." : "Reintentar"}
            </button>
        </div>
    );
}
