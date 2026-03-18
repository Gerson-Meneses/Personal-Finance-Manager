import { Between, IsNull } from "typeorm"
import { AppDataSourceProd } from "../database/dataBaseDev"
import { Account } from "../entities/Account.entity"
import { Category } from "../entities/Category.entity"
import { Loan } from "../entities/Loan.entity"
import { Transaction } from "../entities/Transaction.entity"
import { DashboardQuerySchema } from "../schemas/dashboardQuerySchema"
import { TypeTransaction } from "../utils/Enums"

const round = (n: number) => Math.round(n * 100) / 100

const money = (value?: number | null) => round(value ?? 0) / 100;

export interface DashboardResponse {

    balances: {
        debit: number
        credit: number
    }

    credit: {
        debt: number
    }

    loans: {
        totalDebt: number
        totalAmtDue: number
        given: Loan[]
        received: Loan[]
    }

    month: {
        income: number
        expense: number
        net: number
    }

    expensesByCategory: {
        category: Category
        amount: number
    }[]

    accounts: Account[]

    recentActivity: {
        transactions: Transaction[]
    }

}

export class DashboardService {

    private accountRepo = AppDataSourceProd.getRepository(Account)
    private transactionRepo = AppDataSourceProd.getRepository(Transaction)
    private loanRepo = AppDataSourceProd.getRepository(Loan)

    async getDashboard(userId: string, queryData: DashboardQuerySchema): Promise<DashboardResponse> {

        let { month, year, recentsTransactions } = queryData

        const now = new Date()
        if (!month) month = now.getMonth() + 1
        if (!year) year = now.getFullYear()

        const startOfMonth = new Date(year, month - 1, 1)
        const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999)

        /* -------------------------------- */
        /* ACCOUNTS */
        /* -------------------------------- */

        const accounts = await this.accountRepo.find({
            where: { user: { id: userId } }
        })

        let debit = 0
        let credit = 0

        for (const acc of accounts) {

            if (acc.type === "CREDIT") {
                credit += money(acc.balance)
            } else {
                debit += money(acc.balance)
            }

            acc.balance = money(acc.balance)
        }

        /* -------------------------------- */
        /* CREDIT CARD DEBT */
        /* -------------------------------- */


        const creditDebt = accounts
            .filter(a => a.type === "CREDIT")
            .reduce((sum, a) => {
                let balanceWithOverdraft = a.creditLimit * ((a.overdraft / 100 || 0) + 1);
                return sum + ((balanceWithOverdraft) - (a.balance*100))
            }, 0)

        /* -------------------------------- */
        /* LOANS */
        /* -------------------------------- */

        const loans = await this.loanRepo.find({
            where: { user: { id: userId } },
            order: { createdAt: "DESC" }
        })

        const given = loans.filter(l => l.type === "GIVEN").map(loan => ({ ...loan, principalAmount: money(loan.principalAmount) }))
        const received = loans.filter(l => l.type === "RECEIVED").map(loan => ({ ...loan, principalAmount: money(loan.principalAmount) }))

        const totalDebt = received.reduce(
            (sum, l) => sum + l.principalAmount,
            0
        )

        const totalAmtDue = given.reduce(
            (sum, l) => sum + l.principalAmount,
            0
        )

        /* -------------------------------- */
        /* MONTH INCOME */
        /* -------------------------------- */

        const incomeMonthRaw = await this.transactionRepo
            .createQueryBuilder("t")
            .select("COALESCE(SUM(t.amount),0)", "total")
            .where("t.userId = :userId", { userId })
            .andWhere("t.type = 'INCOME'")
            .andWhere("t.date >= :start", { start: startOfMonth })
            .andWhere("t.date <= :end", { end: endOfMonth })
            .andWhere("t.loanId IS NULL")
            .getRawOne()

        const incomeMonth = money(Number(incomeMonthRaw.total))

        /* -------------------------------- */
        /* MONTH EXPENSE */
        /* -------------------------------- */

        const expenseMonthRaw = await this.transactionRepo
            .createQueryBuilder("t")
            .select("COALESCE(SUM(t.amount),0)", "total")
            .where("t.userId = :userId", { userId })
            .andWhere("t.type = 'EXPENSE'")
            .andWhere("t.date >= :start", { start: startOfMonth })
            .andWhere("t.date <= :end", { end: endOfMonth })
            .andWhere("t.loanPaymentId IS NULL")
            .getRawOne()

        const expenseMonth = money(Number(expenseMonthRaw.total))

        /* -------------------------------- */
        /* EXPENSES BY CATEGORY */
        /* -------------------------------- */

        const rawCategories = await this.transactionRepo
            .createQueryBuilder("t")
            .leftJoinAndSelect("t.category", "category")
            .select("category.id", "id")
            .addSelect("category.name", "name")
            .addSelect("category.color", "color")
            .addSelect("category.icon", "icon")
            .addSelect("SUM(t.amount)", "amount")
            .where("t.userId = :userId", { userId })
            .andWhere("t.type = 'EXPENSE'")
            .andWhere("t.date >= :start", { start: startOfMonth })
            .andWhere("t.date <= :end", { end: endOfMonth })
            .groupBy("category.id")
            .addGroupBy("category.name")
            .addGroupBy("category.color")
            .addGroupBy("category.icon")
            .getRawMany()

        const expensesByCategory = rawCategories.map(row => ({
            category: {
                id: row.id,
                name: row.name,
                color: row.color,
                icon: row.icon
            } as Category,
            amount: money(Number(row.amount))
        }))

        /* -------------------------------- */
        /* RECENT TRANSACTIONS */
        /* -------------------------------- */

        const recentTransactions = await this.transactionRepo.find({
            where: {
                user: { id: userId }
            },
            relations: ["category"],
            order: {
                createdAt: "DESC"
            },
            take: recentsTransactions ?? 5
        })

        for (const t of recentTransactions) {
            t.amount = money(t.amount)
        }

        /* -------------------------------- */
        /* RESPONSE */
        /* -------------------------------- */

        return {

            balances: {
                debit,
                credit
            },

            credit: {
                debt: money(creditDebt)
            },

            loans: {
                totalDebt,
                totalAmtDue,
                given,
                received
            },

            month: {
                income: incomeMonth,
                expense: expenseMonth,
                net: incomeMonth - expenseMonth
            },

            expensesByCategory,

            accounts,

            recentActivity: {
                transactions: recentTransactions
            }

        }
    }

}