import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { ToastContext, type ToastApi, type ToastVariant } from "./toastContext";
import "./Toast.css";

interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

/* Máximo de avisos visibles a la vez: los más antiguos salen primero */
const MAX_TOASTS = 3;

/* Los errores se quedan un poco más para dar tiempo a leerlos */
const DURATION_MS: Record<ToastVariant, number> = {
  success: 3200,
  info: 3200,
  error: 5000,
};

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
} as const;

interface ToastViewProps {
  item: ToastItem;
  onDismiss: (id: number) => void;
}

function ToastView({ item, onDismiss }: ToastViewProps) {
  const { id, variant, message } = item;

  useEffect(() => {
    const timer = window.setTimeout(() => onDismiss(id), DURATION_MS[variant]);
    return () => window.clearTimeout(timer);
  }, [id, variant, onDismiss]);

  const Icon = ICONS[variant];

  return (
    <div className={`toast toast--${variant}`} role={variant === "error" ? "alert" : "status"}>
      <Icon size={18} aria-hidden="true" className="toast-icon" />
      <span className="toast-message">{message}</span>
      <button
        type="button"
        className="toast-close"
        aria-label="Cerrar aviso"
        onClick={() => onDismiss(id)}
      >
        <X size={14} aria-hidden="true" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const show = useCallback((message: string, variant: ToastVariant = "success") => {
    nextId.current += 1;
    const id = nextId.current;
    setItems((prev) => [...prev, { id, message, variant }].slice(-MAX_TOASTS));
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      show,
      success: (message) => show(message, "success"),
      error: (message) => show(message, "error"),
      info: (message) => show(message, "info"),
    }),
    [show]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-region" aria-live="polite">
        {items.map((item) => (
          <ToastView key={item.id} item={item} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
