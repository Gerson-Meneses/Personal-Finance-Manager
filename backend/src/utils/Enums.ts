export enum TypeTransaction { INCOME = "INCOME", EXPENSE = "EXPENSE", CREDIT_PAYMENT = "CREDIT_PAYMENT", TRANSFER = "TRANSFER" }
export enum TypeAccount { DEBIT = "DEBIT", CREDIT = "CREDIT", CASH = "CASH" }
export enum TypeLoan { RECEIVED = "RECEIVED", GIVEN = "GIVEN" }
export enum StatusLoan { PENDING = "PENDING", PAID = "PAID" }
export enum ExtraPaymentStrategy { REDUCE_TERM = 'REDUCE_TERM', REDUCE_INSTALLMENT = 'REDUCE_INSTALLMENT' }

export enum TypeCode {
    VERIFY_ACCOUNT = "VERIFY_ACCOUNT",
    RESET_PASSWORD = "RESET_PASSWORD",
    CHANGE_EMAIL = "CHANGE_EMAIL",
    CHANGE_PASSWORD = "CHANGE_PASSWORD",
    DELETE_ACCOUNT = "DELETE_ACCOUNT"
}

/** Periodicidad de un pago/gasto previsto */
export enum RecurrenceFrequency {
    MONTHLY = "MONTHLY",
    WEEKLY = "WEEKLY",
    BIWEEKLY = "BIWEEKLY",
    YEARLY = "YEARLY"
}

export enum RecurringEntryType {
    EXPENSE = "EXPENSE",
    INCOME = "INCOME"
}

export enum RecurringOccurrenceStatus {
    PENDING = "PENDING",
    DUE = "DUE",
    PAID = "PAID",
    SKIPPED = "SKIPPED",
    FAILED = "FAILED"
}