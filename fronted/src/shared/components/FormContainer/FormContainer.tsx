import { twMerge } from "tailwind-merge";
import type { ReactNode } from "react";
import { X } from "lucide-react"; // Importamos Lucide directo

interface FormContainerProps {
  title: string;
  icon?: ReactNode;
  error?: string | null;
  children: ReactNode;
  className?: string;
  subtitle?: string;
  onClose?: () => void; // ← Agregamos esta prop opcional
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
    <div className={twMerge(`w-full bg-[#121225] border border-slate-800 rounded-xl p-4 sm:p-6 shadow-2xl relative`, className)}>
      {/* Cabecera del Formulario */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-6">
        <div className="">
          <section className="flex items-center gap-3">
            {icon && <div className="text-indigo-400">{icon}</div>}
            <h2 className="text-xl font-bold text-white">{title}</h2>
          </section>
          {subtitle && <div className=""> • {subtitle}</div>}
        </div>

        {/* 🎯 Si viene la función onClose, pintamos la X aquí, perfectamente alineada en la cabecera */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-white hover:bg-zinc-800 p-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm flex items-center gap-2">
          <span>⚠️</span>
          <p>{error}</p>
        </div>
      )}

      {/* 🎯 Alternativa en FormContainer.tsx: */}
      <div className="w-full flex flex-col justify-center items-center">
        {children}
      </div>
    </div>
  );
};