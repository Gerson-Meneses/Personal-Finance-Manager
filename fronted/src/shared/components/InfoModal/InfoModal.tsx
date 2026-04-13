import { CheckCircle, AlertCircle, Info } from "lucide-react";
import ModalPortal from "../ModalPortal/ModalPortal"; // Reutilizamos tu Portal
import { getIcon } from "../../utils/GetIcon";

interface InfoModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    message?: string;
    type?: "success" | "error" | "info";
    icon?: string
    customColor?: string;
    buttonText?: string;
}

export default function InfoModal({
    isOpen,
    onClose,
    title = "Mensaje informativo" ,
    message = "Detalles" ,
    type = "info",
    customColor,
    buttonText = "Entendido",
    icon
}: InfoModalProps) {
    if (!isOpen) return null;

    // Mapeo de colores y iconos por defecto
    const config = {
        success: { icon: <CheckCircle size={48} />, color: "#00e676" },
        error: { icon: <AlertCircle size={48} />, color: "#ff5252" },
        info: { icon: <Info size={48} />, color: "#f1c40f" },
    };

    const themeColor = customColor || config[type].color;

    return (
        <ModalPortal isOpen={isOpen} onClose={onClose}>
            <div className="info-modal-card">

                <div className="info-icon" style={{ color: themeColor }}>
                    {icon ? getIcon(icon) : config[type].icon}
                </div>

                <h2>{title}</h2>
                <p>{message}</p>

                <button
                    className={`info-confirm-btn ${type}  `}
                    onClick={onClose}
                    style={{ backgroundColor: themeColor }}
                >
                    {buttonText}
                </button>
            </div>
        </ModalPortal>
    );
}