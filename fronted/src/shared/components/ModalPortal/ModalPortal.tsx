import type { ReactNode } from "react";
import ReactDOM from "react-dom";
import "./ModalPortal.css";

interface Props {
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  color?: string;
}

export default function ModalPortal({ children, isOpen, onClose }: Props) {
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="modal-overlay" onClick={onClose}>
      {/* Eliminamos el botón .close-x de aquí adentro */}
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>,
    document.body
  );
}