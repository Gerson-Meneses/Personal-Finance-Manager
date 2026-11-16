import dayjs, { Dayjs } from "dayjs";
import minMax from 'dayjs/plugin/minMax'
import { Loan } from "../entities/Loan.entity"
import { LoanMovement } from "../entities/LoanMovement.entity"
import { LoanPaymentResponse, LoanResponse, PaymentCalculation } from "../ResponseInterfaces/LoansResponse"
import { money, round } from "../utils/normalizarMoney"
import { toTransactionResponse } from "./TransactionMapper"
import { LoanMovementType, StatusLoan } from "../utils/Enums"
dayjs.extend(minMax)

export const toLoanMovementPaymentResponse = (movement: LoanMovement): LoanPaymentResponse => ({
    id: movement.id,
    amount: money(movement.amount),
    date: movement.date,
    description: movement.note ?? undefined,
    transaction: movement.transaction
        ? toTransactionResponse(movement.transaction, { moneyAmount: true })
        : undefined,
});

export const calculateLoanPaymentStatus = (loan: Loan): PaymentCalculation => {
    if (loan.movements?.length) {
        let advancesInCents = 0;
        let debtIncreaseInCents = 0;
        let repaidInCents = 0;
        let reversedRepaidInCents = 0;
        let forgivenInCents = 0;

        for (const movement of loan.movements) {
            // Un movimiento de reversión no aumenta la deuda: deshace el pago original.
            if (movement.reversalOfMovementId) {
                reversedRepaidInCents += Math.abs(movement.amount);
                continue;
            }

            if (movement.type === LoanMovementType.ADVANCE) {
                advancesInCents += movement.amount;
                debtIncreaseInCents += movement.amount;
            } else if (movement.type === LoanMovementType.INTEREST) {
                debtIncreaseInCents += movement.amount;
            } else if (movement.type === LoanMovementType.REPAYMENT) {
                repaidInCents += movement.amount;
            } else if (movement.type === LoanMovementType.FORGIVENESS) {
                forgivenInCents += Math.abs(movement.amount);
            } else if (movement.type === LoanMovementType.ADJUSTMENT) {
                if (movement.amount >= 0) debtIncreaseInCents += movement.amount;
                else forgivenInCents += Math.abs(movement.amount);
            }
        }

        repaidInCents = Math.max(0, repaidInCents - reversedRepaidInCents);
        const totalDebtInCents = Math.max(0, debtIncreaseInCents - forgivenInCents);
        const remainingInCents = Math.max(0, totalDebtInCents - repaidInCents);

        return {
            totalPaidInCents: repaidInCents,
            totalPaid: round(repaidInCents / 100),
            totalRemaining: round(remainingInCents / 100),
            totalRemainingInCents: remainingInCents,
            percentagePaid: totalDebtInCents > 0 ? Math.round((repaidInCents / totalDebtInCents) * 100) : 0,
            totalAdvanced: round(advancesInCents / 100),
            totalAdvancedInCents: advancesInCents,
            totalForgiven: round(forgivenInCents / 100),
            totalForgivenInCents: forgivenInCents,
            totalDebt: round(totalDebtInCents / 100),
            totalDebtInCents,
        };
    }

    return {
        totalPaidInCents: 0,
        totalPaid: 0,
        totalRemaining: round(Math.max(0, loan.principalAmount / 100)),
        totalRemainingInCents: loan.principalAmount,
        percentagePaid: 0,
        totalAdvanced: round(loan.principalAmount / 100),
        totalAdvancedInCents: loan.principalAmount,
        totalForgiven: 0,
        totalForgivenInCents: 0,
        totalDebt: round(loan.principalAmount / 100),
        totalDebtInCents: loan.principalAmount,
    };
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
    const { id, lender, type, startDate, status, termInMonths, installmentAmount, movements, transactionReference, disbursementAmount, extraCost, tea, contact, notes, cancelledAt, cancelReason } = loan
    const calculation = calculateLoanPaymentStatus(loan)
    const { totalPaid, totalRemaining, percentagePaid, totalAdvanced, totalForgiven, totalDebt } = calculation
    const reversedMovementIds = new Set(
        (movements ?? [])
            .map((movement) => movement.reversalOfMovementId)
            .filter((id): id is string => Boolean(id))
    )

    let loanResponse: LoanResponse = {
        id,
        lender,
        type,
        principalAmount: moneyAmount ? totalDebt : Math.round(totalDebt * 100),
        status,
        startDate,
        amountPaid: totalPaid,
        amountRemaining: totalRemaining,
        percentagePaid,
        paymentCount: movements
            ? movements.filter(
                (movement) =>
                    movement.type === LoanMovementType.REPAYMENT &&
                    !reversedMovementIds.has(movement.id)
            ).length
            : 0,
        totalAdvanced,
        totalForgiven,
        totalDebt,
        contact: contact ? { id: contact.id, name: contact.name } : undefined,
        notes: notes ?? null,
        cancelledAt: cancelledAt ?? null,
        cancelReason: cancelReason ?? null,
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

    if (movements) {
        const repayments = movements.filter(
            (movement) =>
                movement.type === LoanMovementType.REPAYMENT &&
                !reversedMovementIds.has(movement.id)
        )
        if (repayments.length > 0) {
            loanResponse.lastPaymentDate = dayjs.max(repayments.map((movement) => dayjs(movement.date)))?.toDate()
        }
        loanResponse.payments = repayments.map((movement) => ({
            id: movement.id,
            amount: moneyTransaction ? money(movement.amount) : movement.amount,
            date: movement.date,
            description: movement.note ?? undefined,
            transaction: movement.transaction
                ? toTransactionResponse(movement.transaction, { moneyAmount: moneyTransaction })
                : undefined,
        }))
    }

    return loanResponse
}
