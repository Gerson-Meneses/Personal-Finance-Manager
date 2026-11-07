import { twMerge } from "tailwind-merge";
import type { ReactNode } from "react";
import { X, AlertTriangle } from "lucide-react";

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
    <div className={twMerge(`w-full bg-[#0b0d12] border border-white/10 rounded-2xl p-4 sm:p-5 shadow-2xl relative`, className)}>
      <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
        <div className="min-w-0">
          <section className="flex items-center gap-3">
            {icon && <div className="text-[#f1c40f] shrink-0">{icon}</div>}
            <h2 className="text-lg font-semibold text-white truncate">{title}</h2>
          </section>
          {subtitle && <p className="text-sm text-slate-400 mt-1 truncate">{subtitle}</p>}
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            data-tooltip="Cerrar ventana"
            className="relative tooltip-left text-zinc-400 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ml-3"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm flex items-center gap-2">
          <AlertTriangle size={16} className="shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="w-full flex flex-col justify-center items-center">
        {children}
      </div>
    </div>
  );
};
