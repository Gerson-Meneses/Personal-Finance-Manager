import { Dayjs } from "dayjs";
import { ExtraPaymentStrategy, StatusLoan, TypeLoan } from "../utils/Enums";
import { AccountResponse } from "./AccountResponse";
import { TransactionResponse } from "./TransactionInterface";

export interface LoanPaymentResponse {
    id: string;
    amount: number;
    date: Date;
    description?: string;
    strategy?: ExtraPaymentStrategy;
    transaction?: TransactionResponse;
    account?: AccountResponse
}

export interface LoanSummary {
    lender: string;
    GIVEN: {
        totalAmount: number;
        totalPaid: number;
        totalRemaining: number;
        loanCount: number
    }
    RECEIVED: {
        totalAmount: number;
        totalPaid: number;
        totalRemaining: number;
        loanCount: number
    }
}

export interface LoanResponse {
    // Desde la Entidad
    id: string;
    lender: string;
    type: TypeLoan;
    principalAmount: number;
    status: StatusLoan;
    startDate: Date;
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
    endPaymentDue?: Dayjs;
    description?: string;

    // Relaciones
    transaction?: TransactionResponse
    payments?: LoanPaymentResponse[]
}


export interface PaymentCalculation {
    totalPaidInCents: number;
    totalPaid: number;
    totalRemaining: number;
    percentagePaid: number;
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
  byType: {
    [key in TypeLoan]?: LoanSummaryDetail;
  };
  total: LoanSummaryDetail;
}
 
export interface LoanSummaryFlat {
  lender: string;
  type: TypeLoan;
  detail: LoanSummaryDetail;
}