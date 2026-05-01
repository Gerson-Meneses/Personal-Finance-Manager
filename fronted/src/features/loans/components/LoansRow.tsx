import type { LoanWithProgress } from "../types";

interface LoanRowProps {
  loan: LoanWithProgress;
  isFirstInGroup: boolean;
  onPay: (loan: LoanWithProgress) => void;
}

export function LoanRow({ loan, isFirstInGroup, onPay }: LoanRowProps) {
  const isGiven = loan.type === "GIVEN";
  const statusColor = {
    PAID: "bg-green-50",
    PENDING: "bg-white"
  };

  return (
    <span className={`border-b border-gray-100 ${statusColor[loan.status]} hover:bg-gray-50 transition`}>
      {/* Acreedor */}
      <td className="px-6 py-4">
        <div className="font-medium text-gray-900">{loan.lender}</div>
        {loan.description && (
          <div className="text-sm text-gray-500 mt-1">{loan.description}</div>
        )}
      </td>

      {/* Tipo */}
      <td className="px-6 py-4">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          isGiven
            ? "bg-green-100 text-green-800"
            : "bg-red-100 text-red-800"
        }`}>
          {isGiven ? "A Cobrar" : "A Deber"}
        </span>
      </td>

      {/* Principal */}
      <td className="px-6 py-4 text-right">
        <div className="font-semibold text-gray-900">S/ {loan.principalAmount.toFixed(2)}</div>
      </td>

      {/* Pagado */}
      <td className="px-6 py-4 text-right">
        <div className="font-medium text-green-600">S/ {loan.amountPaid.toFixed(2)}</div>
      </td>

      {/* Pendiente */}
      <td className="px-6 py-4 text-right">
        <div className={`font-semibold ${
          isGiven ? "text-green-600" : "text-red-600"
        }`}>
          S/ {loan.amountRemaining.toFixed(2)}
        </div>
      </td>

      {/* Progreso */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden max-w-xs">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${loan.percentagePaid}%` }}
            />
          </div>
          <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
            {loan.percentagePaid}%
          </span>
        </div>
      </td>

      {/* Estado */}
      <td className="px-6 py-4">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          loan.status === "PAID"
            ? "bg-green-100 text-green-800"
            : "bg-yellow-100 text-yellow-800"
        }`}>
          {loan.status === "PAID" ? "Pagado" : "Pendiente"}
        </span>
      </td>

      {/* Acciones */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-2 justify-end">
          {loan.status === "PENDING" && loan.amountRemaining > 0 && (
            <button
              onClick={() => onPay(loan)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Pagar
            </button>
          )}

          <button
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition"
            title="Ver detalles"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
        </div>
      </td>
    </span>
  );
}