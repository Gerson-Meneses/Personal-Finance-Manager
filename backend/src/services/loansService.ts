import { AppDataSourceProd } from "../database/dataBaseDev";
import { Loan } from "../entities/Loan.entity";
import { LoanInstallment } from "../entities/LoanInstallment.entity";
import { LoanPayment } from "../entities/LoanPayment.entity";
import { Transaction } from "../entities/Transaction.entity";
import { ConflictError, NotFoundError } from "../helpers/errors/domain.errors";
import { LoanSchema } from "../schemas/loan.schema";
import { LoanPaymentSchema } from "../schemas/loanPayment.schema";
import { PaginationQuerySchema } from "../schemas/queryPagination.schema";
import { UuidSchema } from "../schemas/uuid.schema";
import { PaginatedResult } from "../types";
import { StatusLoan, TypeLoan, TypeTransaction } from "../utils/Enums";
import { TransactionService } from "./transactionService";
import { UserService } from "./userService";



export class LoansService {
    private loanRepo = AppDataSourceProd.getRepository(Loan)
    private loanInstallmenrRepo = AppDataSourceProd.getRepository(LoanInstallment)
    private loanPaymentRepo = AppDataSourceProd.getRepository(LoanPayment)
    private transactionRepo = AppDataSourceProd.getRepository(Transaction)
    private userService = new UserService()
    private transactionService = new TransactionService()

    async getLoans(userId: UuidSchema, filters: PaginationQuerySchema): Promise<PaginatedResult<Loan>> {
        const page = filters.page && filters.page > 0 ? filters.page : 1;
        const limit = filters.limit && filters.limit > 0 ? filters.limit : 20;
        const order = filters.order ?? 'DESC';

        const qb = this.loanRepo
            .createQueryBuilder('t')
            .leftJoinAndSelect('t.payments', 'payments')
            .where('t.userId = :userId', { userId: userId });

        qb.orderBy('t.startDate', order)
            .skip((page - 1) * limit)
            .take(limit);

        let [loans, total] = await qb.getManyAndCount();

        loans = loans.map(loan => ({ ...loan, principalAmount: loan.principalAmount / 100, payments: loan.payments.map(payment => ({ ...payment, amount: payment.amount / 100 })) }))

        return {
            items: loans,
            total,
            page,
            limit,
        };
    }

    async getLoan(userId: UuidSchema, loanId: UuidSchema): Promise<Loan> {
        const loan = await this.loanRepo.findOne({ relations: ["user", "payments"], where: { user: { id: userId }, id: loanId } })
        if (!loan) throw new NotFoundError("Prestamo no encontrado.")

        return { ...loan, principalAmount: loan.principalAmount / 100 }
    }

    async createLoan(userId: UuidSchema, loanData: LoanSchema): Promise<any> {
        const user = await this.userService.getUserById(userId)
        const type = (loanData.type == TypeLoan.GIVEN) ? TypeTransaction.EXPENSE : TypeTransaction.INCOME;
        const category = user.categories.find(cat => (cat.name === "PRESTAMO" && cat.type === type))
        if (!category) {
            throw new NotFoundError("Categoria de prestamos no encontrada")
        }
        if (loanData.tea) {
            throw new NotFoundError("Logica para prestamos bancarios no implementada")
        } else {
            const transactionReference = await this.transactionService.createTransaction({
                name: (loanData.type == TypeLoan.GIVEN) ? `Prestamo a ${loanData.lender}` : `Prestamo de ${loanData.lender}`,
                type: type,
                amount: loanData.principalAmount,
                date: loanData.startDate,
                categoryId: category.id,
                accountId: loanData.accountId
            }, userId)

            const loan: Loan = this.loanRepo.create({
                user,
                ...loanData,
                transactionReference
            })

            await this.loanRepo.save(loan)

            transactionReference.loan = loan
            transactionReference.amount = transactionReference.amount * 100

            await this.transactionRepo.save(transactionReference)

            const response = {
                ...loan,
                principalAmount: loan.principalAmount / 100,
                user: user.id,
                transactionReference: transactionReference.id
            }


            return response
        }
    }

    async payLoan(userId: UuidSchema, loanId: UuidSchema, data: LoanPaymentSchema): Promise<any> {

        const user = await this.userService.getUserById(userId)
        const loan = await this.getLoan(userId, loanId)

        let amountPaid = loan.payments.reduce((total, payment) => total + payment.amount, 0);
        amountPaid = amountPaid / 100
        if (amountPaid >= loan.principalAmount) {
            throw new ConflictError("El prestamo ya esta pagado")
        }

        if (data.amount > ((loan.principalAmount - amountPaid) * 100)) {
            throw new ConflictError("El monto del pago excede el monto restante del prestamo, monto restante: " + (loan.principalAmount - amountPaid))
        }

        if (loan.status === StatusLoan.PAID) {
            throw new ConflictError("No se puede pagar un prestano ya pagado")
        }

        const type = (loan.type == TypeLoan.GIVEN) ? TypeTransaction.INCOME : TypeTransaction.EXPENSE;
        const category = user.categories.find(cat => (cat.name === "DEVOLUCION DE PRESTAMO" && cat.type === type))
        if (!category) {
            throw new NotFoundError("Categoria de prestamos no encontrada")
        }

        const { date, amount, accountId } = data

        const transaction: Transaction = await this.transactionService.createTransaction({
            name: (loan.type == TypeLoan.GIVEN) ? `Pago de prestamo de ${loan.lender}` : `Pago de prestamo a ${loan.lender}`,
            type,
            amount,
            date,
            categoryId: category.id,
            accountId
        }, user.id)

        const loanPayment: LoanPayment = this.loanPaymentRepo.create({
            loan,
            ...data,
            transaction
        })

        await this.loanPaymentRepo.save(loanPayment)

        loan.payments.push(loanPayment)
        loan.principalAmount = loan.principalAmount * 100

        await this.loanRepo.save(loan)

        transaction.loanPayment = loanPayment
        transaction.amount = transaction.amount * 100
        await this.transactionRepo.save(transaction)

        amountPaid = loan.payments.reduce((total, payment) => total + payment.amount, 0);
        if (amountPaid >= loan.principalAmount) {
            loan.status = StatusLoan.PAID
            await this.loanRepo.save(loan)
        }


        const response = {
            ...loanPayment,
            amount: loanPayment.amount / 100,
            loan: loan.id,
            transaction: transaction.id
        }

        return response


    }
}