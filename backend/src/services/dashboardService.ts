import { Between, In, IsNull } from "typeorm"
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
import { calculateLoanPaymentStatus } from "../mappers/LoansMapper"

type DashboardLoan = Loan & {
    amountRemaining: number
    amountPaid: number
}



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
        given: DashboardLoan[]
        received: DashboardLoan[]
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
            .select("COALESCE(SUM(t.amount) FILTER (WHERE t.type = :incomeType AND t.reportingImpact = :reportingImpact), 0)", "income")
            .addSelect("COALESCE(SUM(t.amount) FILTER (WHERE t.type = :expenseType AND t.reportingImpact = :reportingImpact), 0)", "expense")
            .where("t.userId = :userId", { userId })
            .andWhere("t.date >= :start", { start: startOfMonth })
            .andWhere("t.date <= :end", { end: endOfMonth })
            .setParameters({ incomeType: TypeTransaction.INCOME, expenseType: TypeTransaction.EXPENSE, reportingImpact: "REPORTABLE" })
            .getRawOne()

        // Distribuye el gasto por categoría respetando las divisiones.
        const categoriesPromise = this.transactionRepo.query(
            `
            SELECT category.id,
                   category.name,
                   category.color,
                   category.icon,
                   COALESCE(SUM(src.amount), 0) AS amount,
                   COUNT(DISTINCT src.id)::text AS "transactionCount"
            FROM (
                SELECT t.id,
                       COALESCE(split."categoryId", t."categoryId") AS "categoryId",
                       COALESCE(split.amount, t.amount) AS amount
                FROM "transactions" t
                LEFT JOIN "transaction_splits" split ON split."transactionId" = t.id
                WHERE t."userId" = $1
                  AND t.type = 'EXPENSE'
                  AND t."reportingImpact" = $2
                  AND t.date >= $3
                  AND t.date <= $4
            ) src
            LEFT JOIN "categories" category ON category.id = src."categoryId"
            GROUP BY category.id, category.name, category.color, category.icon
            `,
            [userId, "REPORTABLE", startOfMonth, endOfMonth]
        )

        const recentPromise = this.transactionRepo.find({
            where: {
                user: { id: userId }
            },
            relations: ["category", "account", "relatedAccount", "loan", "tags", "splits", "splits.category", "items"],
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
                where: {
                    user: { id: userId },
                    status: In([StatusLoan.PENDING, StatusLoan.PARTIALLY_PAID, StatusLoan.OVERDUE]),
                },
                relations: ["movements"],
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

        const toDashboardLoan = (loan: Loan): DashboardLoan => {
            const paymentStatus = calculateLoanPaymentStatus(loan)
            return {
                ...loan,
                principalAmount: money(loan.principalAmount),
                amountRemaining: paymentStatus.totalRemaining,
                amountPaid: paymentStatus.totalPaid,
            }
        }

        const given = loans.filter(l => l.type === "GIVEN").map(toDashboardLoan)
        const received = loans.filter(l => l.type === "RECEIVED").map(toDashboardLoan)

        const totalDebt = received.reduce(
            (sum, l) => sum + l.amountRemaining,
            0
        )

        const totalAmtDue = given.reduce(
            (sum, l) => sum + l.amountRemaining,
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

        interface RawCategoryRow {
            id: string | null
            name: string | null
            color: string | null
            icon: string | null
            amount: string
            transactionCount: string
        }

        const expensesByCategory = (rawCategories as RawCategoryRow[]).map(row => (
           {
            category: {
                id: row.id,
                name: row.name,
                color: row.color,
                icon: row.icon
            } as Category,
            amount: money(Number(row.amount)),
            total: Number(row.transactionCount)
        }))

        /* -------------------------------- */
        /* RECENT TRANSACTIONS */
        /* -------------------------------- */

        for (const t of recentTransactions) {
            t.amount = money(t.amount)
            if (t.splits) {
                for (const split of t.splits) {
                    split.amount = money(split.amount)
                }
            }
            if (t.items) {
                for (const item of t.items) {
                    item.unitPrice = money(item.unitPrice)
                    item.total = money(item.total)
                }
            }
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