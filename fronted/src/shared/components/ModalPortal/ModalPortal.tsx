import { useEffect, useRef, type ReactNode } from "react";
import ReactDOM from "react-dom";
import "./ModalPortal.css";

interface Props {
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  color?: string;
}

export default function ModalPortal({ children, isOpen, onClose }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const overlays = document.querySelectorAll(".modal-overlay");
      if (overlays[overlays.length - 1] === overlayRef.current) onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      if (!document.querySelector(".modal-overlay")) {
        document.body.style.overflow = "";
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="modal-overlay" ref={overlayRef} onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>,
    document.body
  );
}
