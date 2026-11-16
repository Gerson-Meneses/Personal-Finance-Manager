export const getMaxBalance = (creditLimit: number, overdraft: number) => {
    return Math.round(creditLimit * ((overdraft ? overdraft / 100 : 0) + 1))
}

export const getCreditCardDebt = (creditLimit: number, overdraft: number, balance: number) => {
    return Math.max(0, getMaxBalance(creditLimit, overdraft) - balance)
}