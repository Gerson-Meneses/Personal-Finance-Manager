import type { ReactNode } from "react";
import ReactDOM from "react-dom";
import { X } from "lucide-react"
import "./ModalPortal.css";

interface Props {
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  color?: string;
}

export default function ModalPortal({ children, isOpen, onClose, color="#0B1628" }: Props) {
    
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div style={{backgroundColor: color}} className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-x" onClick={onClose}><X size={20} /></button>
        { children}
      </div>
    </div>,
    document.body // Se renderiza justo antes del final del body
  );
}