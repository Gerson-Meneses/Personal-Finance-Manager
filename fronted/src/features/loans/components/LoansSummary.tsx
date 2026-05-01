import type { LoanSummary } from "../types";
import { LoanSummaryCard } from "./LoansSummaryCard";


interface LoansSummaryProps {
  summaries: LoanSummary[];
  onQuickPay: (lender: string, type: "GIVEN" | "RECEIVED") => void;
}

export function LoansSummary({ summaries, onQuickPay }: LoansSummaryProps) {
  // Agrupar por estado
  const pending = summaries.filter(s => s.status === "PENDING");
  const paid = summaries.filter(s => s.status === "PAID");

  return (
    <div className="space-y-6">
      {/* Resumen General */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-blue-500">
          <p className="text-sm text-gray-600 mb-1">Total a Deber</p>
          <p className="text-2xl font-bold text-gray-900">
            S/ {pending
              .filter(s => s.type === "RECEIVED")
              .reduce((sum, s) => sum + s.totalRemaining, 0)
              .toFixed(2)}
          </p>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-green-500">
          <p className="text-sm text-gray-600 mb-1">Total a Cobrar</p>
          <p className="text-2xl font-bold text-gray-900">
            S/ {pending
              .filter(s => s.type === "GIVEN")
              .reduce((sum, s) => sum + s.totalRemaining, 0)
              .toFixed(2)}
          </p>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-purple-500">
          <p className="text-sm text-gray-600 mb-1">Préstamos Activos</p>
          <p className="text-2xl font-bold text-gray-900">{pending.length}</p>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-gray-400">
          <p className="text-sm text-gray-600 mb-1">Préstamos Completados</p>
          <p className="text-2xl font-bold text-gray-900">{paid.length}</p>
        </div>
      </div>

      {/* Préstamos Pendientes */}
      {pending.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">PRÉSTAMOS PENDIENTES</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pending.map(summary => (
              <LoanSummaryCard
                key={`${summary.lender}-${summary.type}`}
                summary={summary}
                onQuickPay={onQuickPay}
              />
            ))}
          </div>
        </div>
      )}

      {/* Préstamos Completados */}
      {paid.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">PRÉSTAMOS COMPLETADOS</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paid.map(summary => (
              <LoanSummaryCard
                key={`${summary.lender}-${summary.type}`}
                summary={summary}
                onQuickPay={onQuickPay}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}