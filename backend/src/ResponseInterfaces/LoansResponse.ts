import { Dayjs } from "dayjs";
import { ExtraPaymentStrategy, StatusLoan, TypeLoan } from "../utils/Enums";
import { AccountResponse } from "./AccountResponse";
import { TransactionResponse } from "./TransactionInterface";

export interface LoanPaymentResponse {
    id: string;
    amount: number;
    date: string | Date;
    description?: string;
    strategy?: ExtraPaymentStrategy;
    transaction?: TransactionResponse;
    account?: AccountResponse
}

export interface LoanResponse {
    // Desde la Entidad
    id: string;
    lender: string;
    contact?: { id: string; name: string };
    type: TypeLoan;
    principalAmount: number;
    status: StatusLoan;
    startDate: string | Date;
    termInMonths?: number;
    installmentAmount?: number;
    disbursementAmount?: number;
    extraCost?: number;
    tea?: number;


    // Calculado en Mapper
    amountPaid: number;
    amountRemaining: number;
    percentagePaid: number;
    lastPaymentDate?: Date;
    paymentCount: number;
    totalAdvanced?: number;
    totalForgiven?: number;
    totalDebt?: number;
    endPaymentDue?: Dayjs;
    description?: string;
    notes?: string | null;
    cancelledAt?: Date | string | null;
    cancelReason?: string | null;

    // Relaciones
    transaction?: TransactionResponse
    payments?: LoanPaymentResponse[]
}


export interface PaymentCalculation {
    totalPaidInCents: number;
    totalPaid: number;
    totalRemaining: number;
    totalRemainingInCents: number;
    percentagePaid: number;
    totalAdvanced: number;
    totalAdvancedInCents: number;
    totalForgiven: number;
    totalForgivenInCents: number;
    totalDebt: number;
    totalDebtInCents: number;
}

export interface LoanSummaryDetail {
  totalAmount: number;      // Total del principal
  totalPaid: number;        // Total pagado
  totalRemaining: number;   // Total pendiente
  loanCount: number;        // Cantidad de préstamos
  averageRemaining?: number; // Promedio pendiente por préstamo
  progress?: number;        // % de progreso (totalPaid / totalAmount)
}
 
export interface LoanSummaryGrouped {
  lender: string;
  contactId?: string;
  byType: {
    [key in TypeLoan]?: LoanSummaryDetail;
  };
  total: LoanSummaryDetail;
}
