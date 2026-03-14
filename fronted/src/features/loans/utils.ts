import type { Loan } from "./types"

export const getTotalPaid = (loan: Loan) => {
  if (!loan.payments) return 0

  return loan.payments.reduce(
    (sum, payment) => sum + payment.amount,
    0
  )
}

export const getRemaining = (loan: Loan) => {
  const paid = getTotalPaid(loan)
  return loan.principalAmount - paid
}

export const getProgress = (loan: Loan) => {
  const paid = getTotalPaid(loan)

  return Math.min(
    (paid / loan.principalAmount) * 100,
    100
  )
}