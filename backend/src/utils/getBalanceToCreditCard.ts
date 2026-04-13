export const getMaxBalance = (creditLimit: number, overdraft: number) => {
    return Math.floor(creditLimit * ((overdraft ? overdraft / 100 : 0) + 1))
}