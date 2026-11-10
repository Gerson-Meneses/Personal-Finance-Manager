export const getMaxBalance = (creditLimit: number, overdraft: number) => {
    return Math.round(creditLimit * ((overdraft ? overdraft / 100 : 0) + 1))
}