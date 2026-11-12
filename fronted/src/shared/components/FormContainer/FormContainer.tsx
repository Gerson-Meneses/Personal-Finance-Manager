import { twMerge } from "tailwind-merge";
import type { ReactNode } from "react";
import { X, AlertTriangle } from "lucide-react";
import "./FormContainer.css";

interface FormContainerProps {
  title: string;
  icon?: ReactNode;
  error?: string | null;
  children: ReactNode;
  className?: string;
  subtitle?: string;
  onClose?: () => void;
}

export const FormContainer = ({
  title,
  icon,
  error,
  children,
  subtitle,
  className = "",
  onClose
}: FormContainerProps) => {
  return (
    <div className={twMerge("form-container", className)}>
      <div className="form-container__head">
        <div className="form-container__heading">
          {icon && <div className="form-container__icon">{icon}</div>}
          <div className="form-container__titles">
            <h2 className="form-container__title">{title}</h2>
            {subtitle && <p className="form-container__subtitle">{subtitle}</p>}
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            data-tooltip="Cerrar ventana"
            className="form-container__close tooltip-left"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {error && (
        <div role="alert" aria-live="assertive" className="form-container__error">
          <AlertTriangle size={16} />
          <p>{error}</p>
        </div>
      )}

      <div className="form-container__body">
        {children}
      </div>
    </div>
  );
};
