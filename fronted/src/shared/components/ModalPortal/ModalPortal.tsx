import { useEffect, useRef, type ReactNode } from "react";
import ReactDOM from "react-dom";
import { focusFirstElement, trapTabKey } from "../../utils/focus";
import "./ModalPortal.css";

interface Props {
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  color?: string;
}

let bodyScrollLocks = 0;

function lockBodyScroll() {
  if (bodyScrollLocks === 0) {
    document.body.style.overflow = "hidden";
  }
  bodyScrollLocks += 1;
}

function unlockBodyScroll() {
  bodyScrollLocks = Math.max(0, bodyScrollLocks - 1);
  if (bodyScrollLocks === 0) {
    document.body.style.overflow = "";
  }
}

export default function ModalPortal({ children, isOpen, onClose }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const previousFocus = document.activeElement as HTMLElement | null;
    lockBodyScroll();

    const onKeyDown = (e: KeyboardEvent) => {
      const overlays = document.querySelectorAll(".modal-overlay");
      const isTopmost = overlays[overlays.length - 1] === overlayRef.current;
      if (!isTopmost) return;

      if (e.key === "Escape") {
        /* Si hay un desplegable abierto dentro del modal, Escape lo cierra
           a él (el propio control lo gestiona) y no el modal entero */
        const hasOpenPopover = overlayRef.current?.querySelector(
          ".select-input-panel, .dx-popover, .icon-popover"
        );
        if (hasOpenPopover) return;
        onClose();
        return;
      }

      if (e.key === "Tab") {
        trapTabKey(e, contentRef.current);
      }
    };

    document.addEventListener("keydown", onKeyDown);

    const focusFrame = requestAnimationFrame(() => {
      focusFirstElement(contentRef.current);
    });

    return () => {
      cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", onKeyDown);
      unlockBodyScroll();
      if (previousFocus?.isConnected) {
        previousFocus.focus();
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="modal-overlay" ref={overlayRef} onClick={onClose}>
      <div
        className="modal-content"
        ref={contentRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
