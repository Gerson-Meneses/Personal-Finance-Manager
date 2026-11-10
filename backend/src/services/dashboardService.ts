import { Between, IsNull } from "typeorm"
import { AppDataSourceProd } from "../database/dataBaseDev"
import { Account } from "../entities/Account.entity"
import { Category } from "../entities/Category.entity"
import { Loan } from "../entities/Loan.entity"
import { Transaction } from "../entities/Transaction.entity"
import { DashboardQuerySchema } from "../schemas/dashboardQuerySchema"
import { money } from "../utils/normalizarMoney"
import { getMaxBalance } from "../utils/getBalanceToCreditCard"
import { StatusLoan, TypeTransaction } from "../utils/Enums"
import { RecurringPaymentService } from "./recurringPaymentService"



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
        total: number
        amount: number
    }[]

    accounts: Account[]

    recentActivity: {
        transactions: Transaction[]
    }

    recurring: {
        month: string
        expectedIncome: number
        expectedExpense: number
        projectedNet: number
        paidExpense: number
        pendingExpense: number
        dueCount: number
    }

}

export class DashboardService {

    private accountRepo = AppDataSourceProd.getRepository(Account)
    private transactionRepo = AppDataSourceProd.getRepository(Transaction)
    private loanRepo = AppDataSourceProd.getRepository(Loan)
    private recurringService = new RecurringPaymentService()

    async getDashboard(userId: string, queryData: DashboardQuerySchema): Promise<DashboardResponse> {

        let { month, year, recentsTransactions } = queryData

        const now = new Date()
        if (!month) month = now.getMonth() + 1
        if (!year) year = now.getFullYear()

        const startOfMonth = new Date(year, month - 1, 1)
        const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999)
        const monthKey = `${year}-${String(month).padStart(2, "0")}`

        /* -------------------------------- */
        /* QUERIES (todas independientes -> en paralelo) */
        /* -------------------------------- */

        const incomeExpensePromise = this.transactionRepo
            .createQueryBuilder("t")
            .select("COALESCE(SUM(t.amount) FILTER (WHERE t.type = :incomeType AND t.loanId IS NULL), 0)", "income")
            .addSelect("COALESCE(SUM(t.amount) FILTER (WHERE t.type = :expenseType AND t.loanPaymentId IS NULL), 0)", "expense")
            .where("t.userId = :userId", { userId })
            .andWhere("t.date >= :start", { start: startOfMonth })
            .andWhere("t.date <= :end", { end: endOfMonth })
            .setParameters({ incomeType: TypeTransaction.INCOME, expenseType: TypeTransaction.EXPENSE })
            .getRawOne()

        const categoriesPromise = this.transactionRepo
            .createQueryBuilder("t")
            .leftJoinAndSelect("t.category", "category")
            .select("category.id", "id")
            .addSelect("category.name", "name")
            .addSelect("category.color", "color")
            .addSelect("category.icon", "icon")
            .addSelect("SUM(t.amount)", "amount")
            .addSelect("COUNT(t.id)", "transactionCount")
            .where("t.userId = :userId", { userId })
            .andWhere("t.type = 'EXPENSE'")
            .andWhere("t.date >= :start", { start: startOfMonth })
            .andWhere("t.date <= :end", { end: endOfMonth })
            .groupBy("category.id")
            .addGroupBy("category.name")
            .addGroupBy("category.color")
            .addGroupBy("category.icon")
            .getRawMany()

        const recentPromise = this.transactionRepo.find({
            where: {
                user: { id: userId }
            },
            relations: ["category", "account", "relatedAccount", "loan", "loanPayment"],
            order: {
                createdAt: "DESC"
            },
            take: recentsTransactions ?? 5
        })

        const [accounts, loans, incomeExpenseRaw, rawCategories, recentTransactions, recurringProjection] = await Promise.all([
            this.accountRepo.find({
                where: { user: { id: userId } }
            }),
            this.loanRepo.find({
                where: { user: { id: userId }, status: StatusLoan.PENDING },
                order: { createdAt: "DESC" }
            }),
            incomeExpensePromise,
            categoriesPromise,
            recentPromise,
            this.recurringService.getMonthProjection(userId, monthKey)
        ])

        /* -------------------------------- */
        /* ACCOUNTS */
        /* -------------------------------- */

        let debit = 0
        let credit = 0

        for (const acc of accounts) {

            if (acc.type === "CREDIT") {
                credit += money(acc.balance)
                acc.creditLimit = money(acc.creditLimit)
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
                return sum + (((getMaxBalance(a.creditLimit, a.overdraft)) - (a.balance)))
            }, 0)
        /* -------------------------------- */
        /* LOANS */
        /* -------------------------------- */

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
        /* MONTH INCOME / EXPENSE (una sola query) */
        /* -------------------------------- */

        const incomeMonth = money(Number(incomeExpenseRaw?.income ?? 0))
        const expenseMonth = money(Number(incomeExpenseRaw?.expense ?? 0))

        /* -------------------------------- */
        /* EXPENSES BY CATEGORY */
        /* -------------------------------- */

        const expensesByCategory = rawCategories.map(row => (
           {
            category: {
                id: row.id,
                name: row.name,
                color: row.color,
                icon: row.icon
            } as Category,
            amount: money(Number(row.amount)),
            total: row.transactionCount
        }))

        /* -------------------------------- */
        /* RECENT TRANSACTIONS */
        /* -------------------------------- */

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
                debt: creditDebt
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
            },

            recurring: {
                month: recurringProjection.month,
                expectedIncome: recurringProjection.expectedIncome,
                expectedExpense: recurringProjection.expectedExpense,
                projectedNet: recurringProjection.projectedNet,
                paidExpense: recurringProjection.paidExpense,
                pendingExpense: recurringProjection.pendingExpense,
                dueCount: recurringProjection.dueCount
            }

        }
    }

}