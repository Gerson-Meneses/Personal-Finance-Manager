import dayjs, { Dayjs } from "dayjs";
import minMax from 'dayjs/plugin/minMax'
import { Loan } from "../entities/Loan.entity"
import { LoanPayment } from "../entities/LoanPayment.entity"
import { LoanPaymentResponse, LoanResponse, PaymentCalculation } from "../ResponseInterfaces/LoansResponse"
import { money, round } from "../utils/normalizarMoney"
import { toTransactionResponse } from "./TransactionMapper"
import { StatusLoan } from "../utils/Enums"
dayjs.extend(minMax)

export interface ToLoanPaymentResponseProps {
    moneyAmount?: boolean
    transactionAmount?: boolean
}

export const toLoanPaymentResponse = (loanPayment: LoanPayment, { moneyAmount = true, transactionAmount = true }: ToLoanPaymentResponseProps = {}): LoanPaymentResponse => {

    const { id, amount, date } = loanPayment

    let loanPaymentResponse: LoanPaymentResponse = {
        id,
        amount: moneyAmount ? money(amount) : amount,
        date
    }

    if (loanPayment.strategy) loanPaymentResponse = { ...loanPaymentResponse, strategy: loanPayment.strategy }
    if (loanPayment.transaction) {
        loanPaymentResponse = { ...loanPaymentResponse, transaction: toTransactionResponse(loanPayment.transaction, { moneyAmount: transactionAmount }) }
        if (loanPayment.transaction.description) loanPaymentResponse.description = loanPayment.transaction.description
    }

    return loanPaymentResponse
}

export const calculateLoanPaymentStatus = (loan: Loan): PaymentCalculation => {
    const totalPaidInCents = loan.payments?.reduce((sum, payment) => sum + payment.amount, 0) ?? 0;
    const principalInCents = loan.principalAmount;

    const totalPaid = totalPaidInCents / 100;
    const principal = principalInCents / 100;

    const totalRemaining = principal - totalPaid;
    const percentagePaid = principal > 0 ? Math.round((totalPaid / principal) * 100) : 0;

    return {
        totalPaidInCents,
        totalPaid: round(totalPaid),
        totalRemaining: round(Math.max(0, totalRemaining)),
        percentagePaid,
    };
}

export const getLastPaymentDate = (loan: Loan): Date | undefined => {
    if (!loan.payments || loan.payments.length === 0) return undefined;
    const maxDate = dayjs.max(loan.payments.map(p => dayjs(p.date)));
    if (!maxDate) return undefined;
    return maxDate.toDate();
}

export const calculateEndPaymentDue = (loan: Loan): Dayjs | undefined => {
    if (loan.status === StatusLoan.PAID) return undefined;
    if (!loan.termInMonths) return undefined;
    const dueDate = dayjs(loan.startDate).add(loan.termInMonths, "M")
    return dueDate;
}

export interface LoansMapperProps {
    moneyAmount?: boolean
    moneyTransaction?: boolean
}

export const toLoanResponse = (loan: Loan, { moneyAmount = true, moneyTransaction = true }: LoansMapperProps = {}): LoanResponse => {
    const { id, lender, type, principalAmount, startDate, status, termInMonths, installmentAmount, payments, transactionReference, disbursementAmount, extraCost, tea } = loan
    const { totalPaid, totalRemaining, percentagePaid } = calculateLoanPaymentStatus(loan)

    let loanResponse: LoanResponse = {
        id,
        lender,
        type,
        principalAmount: moneyAmount ? money(principalAmount) : principalAmount,
        status,
        startDate,
        amountPaid: totalPaid,
        amountRemaining: totalRemaining,
        percentagePaid: percentagePaid,
        paymentCount: payments ? payments.length : 0
    }

    if (termInMonths) {
        loanResponse.termInMonths = termInMonths
        loanResponse.endPaymentDue = calculateEndPaymentDue(loan)
    }
    if (installmentAmount) loanResponse.installmentAmount = moneyAmount ? money(installmentAmount) : installmentAmount
    if (disbursementAmount) loanResponse.disbursementAmount = moneyAmount ? money(disbursementAmount) : disbursementAmount
    if (extraCost) loanResponse.extraCost = moneyAmount ? money(extraCost) : extraCost
    if (tea) loanResponse.tea = tea

    if (transactionReference) {
        loanResponse.transaction = toTransactionResponse(transactionReference, { moneyAmount: moneyTransaction })
        if (transactionReference.description) loanResponse.description = transactionReference.description
    }

    if (payments) {
        loanResponse.lastPaymentDate = getLastPaymentDate(loan)
        loanResponse.payments = payments.map(payment => toLoanPaymentResponse(payment))
    }

    return loanResponse
} 