export enum TypeTransaction { INCOME = "INCOME", EXPENSE = "EXPENSE", CREDIT_PAYMENT = "CREDIT_PAYMENT", TRANSFER = "TRANSFER" }
export enum TypeAccount { DEBIT = "DEBIT", CREDIT = "CREDIT", CASH = "CASH" }
export enum TypeLoan { RECEIVED = "RECEIVED", GIVEN = "GIVEN" }
export enum StatusLoan { PENDING = "PENDING", PAID = "PAID" }
export enum ExtraPaymentStrategy { REDUCE_TERM = 'REDUCE_TERM', REDUCE_INSTALLMENT = 'REDUCE_INSTALLMENT' }

export enum TypeCode {
    VERIFY_ACCOUNT = "VERIFY_ACCOUNT",
    RESET_PASSWORD = "RESET_PASSWORD"
}