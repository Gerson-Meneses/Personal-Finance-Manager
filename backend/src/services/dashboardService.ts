import { MoreThan } from "typeorm"
import { AppDataSourceProd } from "../database/dataBaseDev"
import { Account } from "../entities/Account.entity"
import { Category } from "../entities/Category.entity"
import { Loan } from "../entities/Loan.entity"
import { Transaction } from "../entities/Transaction.entity"
import { DashboardQuerySchema } from "../schemas/dashboardQuerySchema"

export interface DashboardData {
    totalBalanceDebit: number
    totalBalanceCredit: number
    totalDue: number
    incomeMonth: number
    expenseMonth: number
    expensesByCategory: { category: Category, amount: number }[]
    accounts: Account[]
    loans: Loan[]
    recentTransactions: Transaction[]
}

export class dashboardService {
    private accountRepo = AppDataSourceProd.getRepository(Account);
    private transactionRepo = AppDataSourceProd.getRepository(Transaction);
    private categoryRepo = AppDataSourceProd.getRepository(Category)
    private loanRepo = AppDataSourceProd.getRepository(Loan)

    async getDashboardData(userId: string, queryData: DashboardQuerySchema): Promise<DashboardData> {
        let { day, month, year } = queryData
        if (!month || !year) {
            const currentDate = new Date()
            month = currentDate.getMonth() + 1
            year = currentDate.getFullYear()
        }

        const accounts = await this.accountRepo.find({ where: { user: { id: userId } } });

        const totalBalanceDebit = accounts.reduce((acc, account) => {
            if (account.type === 'DEBIT' || account.type === 'CASH') {
                return acc + account.balance
            }
            return acc
        }, 0)
        const totalBalanceCredit = accounts.reduce((acc, account) => {
            if (account.type === 'CREDIT') {
                return acc + account.balance
            }
            return acc
        }, 0)
        const totalDue = accounts.reduce((acc, account) => {
            if (account.type === 'CREDIT') {
                return acc + ((account.creditLimit * (1 + (account.overdraft ? account.overdraft : 0) / 100)) - account.balance)
            }
            return acc
        }, 0)

        const transactions = await this.transactionRepo.find({
            where: {
                user: { id: userId },
                date: MoreThan(new Date(year, month - 1, day ? day : 1))
            },
            relations: ['category']
        });

        const incomeMonth = transactions.filter(t => t.type === 'INCOME').reduce((acc, t) => acc + t.amount, 0);
        const expenseMonth = transactions.filter(t => t.type === 'EXPENSE').reduce((acc, t) => acc + t.amount, 0);

        const expensesByCategoryMap: { [key: string]: number } = {};

        transactions.filter(t => t.type === 'EXPENSE').forEach(t => {
            const categoryName = t.category ? t.category.name : 'Uncategorized';
            if (!expensesByCategoryMap[categoryName]) {
                expensesByCategoryMap[categoryName] = 0;
            }
            expensesByCategoryMap[categoryName] += t.amount;
        });

        const expensesByCategory = Object.entries(expensesByCategoryMap).map(([categoryName, amount]) => ({
            category: { name: categoryName } as Category,
            amount
        }));

        const loans = await this.loanRepo.find({ where: { user: { id: userId } } });

        const recentTransactions = await this.transactionRepo.find({
            where: { user: { id: userId } },
            order: { date: 'DESC' },
            take: queryData.rencentsTransactions || 5,
            relations: ['category']
        });

        return {
            totalBalanceDebit: totalBalanceDebit/100,
            totalBalanceCredit: totalBalanceCredit/100,
            totalDue: totalDue/100,
            incomeMonth: incomeMonth/100,
            expenseMonth: expenseMonth/100,
            expensesByCategory,
            accounts,
            loans,
            recentTransactions
        }
    }


}