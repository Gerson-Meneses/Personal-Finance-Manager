import type { LoanWithProgress } from "../types";
import { LoanRow } from "./LoansRow";

interface LoansTableProps {
  loans: LoanWithProgress[];
  onPay: (loan: LoanWithProgress) => void;
}

export function LoansTable({ loans, onPay }: LoansTableProps) {
  if (loans.length === 0) {
    return (
      <div className="px-6 py-12 text-center">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="mt-4 text-gray-600">No hay préstamos registrados</p>
      </div>
    );
  }

  // Agrupar por lender
  const groupedLoans = loans.reduce((acc, loan) => {
    const key = `${loan.lender}-${loan.type}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(loan);
    return acc;
  }, {} as Record<string, LoanWithProgress[]>);

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Acreedor</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Tipo</th>
            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Principal</th>
            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Pagado</th>
            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Pendiente</th>
            <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Progreso</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Estado</th>
            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(groupedLoans).map(([groupKey, groupLoans]) => (
            <div key={groupKey}>
              {groupLoans.map((loan, index) => (
                <LoanRow
                  key={loan.id}
                  loan={loan}
                  isFirstInGroup={index === 0}
                  onPay={onPay}
                />
              ))}
            </div>
          ))}
        </tbody>
      </table>
    </div>
  );
}