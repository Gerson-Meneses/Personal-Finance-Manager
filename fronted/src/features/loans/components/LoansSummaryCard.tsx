import type { LoanSummary } from "../types";

interface LoanSummaryCardProps {
  summary: LoanSummary;
  onQuickPay: (lender: string, type: "GIVEN" | "RECEIVED") => void;
}

export function LoanSummaryCard({ summary, onQuickPay }: LoanSummaryCardProps) {
  const isGiven = summary.type === "GIVEN";
  const progressPercent = (summary.totalPaid / summary.totalAmount) * 100;

  return (
    <div className={`bg-white rounded-lg p-4 shadow-sm border-t-4 ${
      isGiven ? "border-green-500" : "border-red-500"
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900">{summary.lender}</h3>
          <p className="text-sm text-gray-500">
            {isGiven ? "A cobrar" : "A deber"}
          </p>
        </div>
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          summary.status === "PAID" 
            ? "bg-green-100 text-green-700" 
            : "bg-yellow-100 text-yellow-700"
        }`}>
          {summary.status === "PAID" ? "Pagado" : "Pendiente"}
        </span>
      </div>

      {/* Amounts */}
      <div className="space-y-2 mb-4 pb-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Monto total</span>
          <span className="font-medium text-gray-900">S/ {summary.totalAmount.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Pagado</span>
          <span className="font-medium text-green-600">S/ {summary.totalPaid.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Pendiente</span>
          <span className={`font-medium ${isGiven ? "text-green-600" : "text-red-600"}`}>
            S/ {summary.totalRemaining.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-600">Progreso</span>
          <span className="text-xs font-semibold text-gray-900">{Math.round(progressPercent)}%</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Loan Count */}
      <div className="text-sm text-gray-600 mb-4">
        {summary.loanCount} {summary.loanCount === 1 ? "préstamo" : "préstamos"}
      </div>

      {/* Action Button */}
      {summary.status === "PENDING" && summary.totalRemaining > 0 && (
        <button
          onClick={() => onQuickPay(summary.lender, summary.type)}
          className={`w-full py-2 px-3 rounded text-sm font-medium transition ${
            isGiven
              ? "bg-green-50 text-green-700 hover:bg-green-100"
              : "bg-red-50 text-red-700 hover:bg-red-100"
          }`}
        >
          Pago rápido
        </button>
      )}
    </div>
  );
}