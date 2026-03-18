import type { ReactNode } from "react";
import ReactDOM from "react-dom";

interface Props {
  children: ReactNode;
  onClose: () => void;
}

export default function ModalPortal({ children, onClose }: Props) {
  return ReactDOM.createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>,
    document.body // Se renderiza justo antes del final del body
  );
}