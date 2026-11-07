import { CheckCircle, AlertCircle, Info } from "lucide-react";
import ModalPortal from "../ModalPortal/ModalPortal"; // Reutilizamos tu Portal
import { getIcon } from "../../utils/GetIcon";
import "./InfoModal.css";

interface InfoModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    message?: string;
    type?: "success" | "error" | "info";
    icon?: string
    customColor?: string;
    buttonText?: string;
    /** Si se provee, el modal pasa a modo confirmación (Aceptar / Cancelar) */
    onConfirm?: () => void;
    confirmText?: string;
    cancelText?: string;
    confirmDisabled?: boolean;
}

export default function InfoModal({
    isOpen,
    onClose,
    title = "Mensaje informativo" ,
    message = "Detalles" ,
    type = "info",
    customColor,
    buttonText = "Entendido",
    icon,
    onConfirm,
    confirmText = "Confirmar",
    cancelText = "Cancelar",
    confirmDisabled = false,
}: InfoModalProps) {
    if (!isOpen) return null;

    // Mapeo de colores e iconos por defecto
    const config = {
        success: { icon: <CheckCircle size={30} />, color: "#22c55e" },
        error: { icon: <AlertCircle size={30} />, color: "#ef4444" },
        info: { icon: <Info size={30} />, color: "#f1c40f" },
    };

    const themeColor = customColor || config[type].color;

    return (
        <ModalPortal isOpen={isOpen} onClose={onClose}>
            <div className="info-modal-card">

                <div className="info-icon" style={{ color: themeColor }}>
                    {icon ? getIcon(icon, { size: 30 }) : config[type].icon}
                </div>

                <h2>{title}</h2>
                <p>{message}</p>

                <div className="info-actions">
                    {onConfirm && (
                        <button
                            type="button"
                            className="info-cancel-btn"
                            onClick={onClose}
                            disabled={confirmDisabled}
                        >
                            {cancelText}
                        </button>
                    )}
                    <button
                        type="button"
                        className={`info-confirm-btn ${type} ${onConfirm ? "with-cancel" : ""}`}
                        onClick={onConfirm ?? onClose}
                        disabled={confirmDisabled}
                        style={{ backgroundColor: themeColor }}
                    >
                        {onConfirm ? confirmText : buttonText}
                    </button>
                </div>
            </div>
        </ModalPortal>
    );
}
