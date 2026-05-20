import { useNavigate } from 'react-router-dom';
import type { LoanSummaryGrouped } from '../../types';
import { EyeOff, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

interface LoanCardProps {
  summaryLender: LoanSummaryGrouped;
  isLoading?: boolean;
}

export const LenderSummary: React.FC<LoanCardProps> = ({
  summaryLender,
  isLoading = false,
}) => {
  const { lender, byType } = summaryLender;

  const loansGiven = byType.GIVEN;
  const loansReceived = byType.RECEIVED;

  const navigate = useNavigate()

  // Estado de Carga (Skeleton) adaptado a tus colores oscuros
  if (isLoading) {
    return (
      <div className="bg-[#0b1120] border border-slate-800/60 rounded-2xl p-6 animate-pulse min-h-[220px]">
        <div className="h-6 bg-slate-800 rounded w-1/3 mx-auto mb-6" />
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="h-4 bg-slate-800 rounded w-2/3" />
            <div className="h-3 bg-slate-800 rounded w-1/2" />
            <div className="h-3 bg-slate-800 rounded w-1/2" />
          </div>
          <div className="space-y-3">
            <div className="h-4 bg-slate-800 rounded w-2/3" />
            <div className="h-3 bg-slate-800 rounded w-1/2" />
            <div className="h-3 bg-slate-800 rounded w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  // Estado Sin Préstamos Activos
  if (!loansGiven && !loansReceived) {
    return (
      <div className="bg-[#0b1120]/40 border border-dashed border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[220px] text-center">
        <div className="flex justify-between w-full items-center mb-4 px-2">
          <h3 className="text-slate-200 font-semibold text-lg">{lender}</h3>
          <button className="text-slate-500 hover:text-slate-400 transition-colors">
            <EyeOff size={16} />
          </button>
        </div>
        <div className="text-slate-500 space-y-1 my-auto">
          <span className="text-2xl">📋</span>
          <p className="text-sm font-medium">Sin préstamos activos</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0f172a]/70 border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 hover:border-slate-700 hover:bg-[#0f172a] shadow-lg min-h-[240px]">

      {/* Header de la Tarjeta */}
      <div className="text-center pb-4 border-b border-slate-800/60">
        <h3 className="text-slate-100 font-bold text-lg tracking-wide">{lender}</h3>
      </div>

      {/* Cuerpo con Flexbox/Grid equilibrado */}
      <div className={`grid ${loansGiven && loansReceived ? 'grid-cols-2 gap-6 divide-x divide-slate-800/60' : 'grid-cols-1'} py-4`}>

        {/* Sección: Por Cobrar (Dinero que prestaste -> Verde como tus ingresos) */}
        {loansGiven && (
          <section className="space-y-2.5">
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-xs tracking-wider uppercase">
              <ArrowUpRight size={14} />
              <span>Por Cobrar</span>
            </div>
            <div className="space-y-1 text-xs md:text-sm">
              <p className="text-slate-400">Total: <span className="text-slate-200 font-medium">S/ {loansGiven.totalAmount}</span></p>
              <p className="text-slate-400">Pagado: <span className="text-emerald-500/90 font-medium">S/ {loansGiven.totalPaid}</span></p>
              <p className="text-slate-400 border-t border-slate-800/40 pt-1 mt-1">Restante: <span className="text-emerald-500 font-semibold">S/ {loansGiven.totalRemaining}</span></p>
            </div>
          </section>
        )}

        {/* Sección: Por Pagar (Dinero que te prestaron -> Rosado/Rojo como tus deudas) */}
        {loansReceived && (
          <section className={`space-y-2.5 ${loansGiven ? 'pl-6' : ''}`}>
            <div className="flex items-center gap-1.5 text-rose-400 font-semibold text-xs tracking-wider uppercase">
              <ArrowDownLeft size={14} />
              <span>Por Pagar</span>
            </div>
            <div className="space-y-1 text-xs md:text-sm">
              <p className="text-slate-400">Total: <span className="text-slate-200 font-medium">S/ {loansReceived.totalAmount}</span></p>
              <p className="text-slate-400">Pagado: <span className="text-emerald-500/90 font-medium">S/ {loansReceived.totalPaid}</span></p>
              <p className="text-slate-400 border-t border-slate-800/40 pt-1 mt-1">Restante: <span className="text-rose-400 font-semibold">S/ {loansReceived.totalRemaining}</span></p>
            </div>
          </section>
        )}
      </div>

      {/* Botón de Acción Minimalista */}
      <div className="pt-2">
        <button className="cursor-pointer w-full py-2 text-xs font-medium text-amber-400 bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/20 rounded-xl transition-all duration-150 flex items-center justify-center gap-1 group"
          onClick={() => navigate(lender)}
        >
          <span>Ver Detalles</span>
          <span className="transform transition-transform group-hover:translate-x-1">→</span>
        </button>
      </div>
    </div>
  );
};