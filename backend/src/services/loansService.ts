import { AppDataSourceProd } from "../database/dataBaseDev";
import { Loan } from "../entities/Loan.entity";
import { LoanInstallment } from "../entities/LoanInstallment.entity";
import { LoanPayment } from "../entities/LoanPayment.entity";
import { Transaction } from "../entities/Transaction.entity";
import { ConflictError, NotFoundError } from "../helpers/errors/domain.errors";
import { LoanSchema } from "../schemas/loan.schema";
import { LoanPaymentSchema } from "../schemas/loanPayment.schema";
import { PaginationQuerySchema } from "../schemas/queryPagination.schema";
import { quickPaymentSchema, QuickPaymentSchema } from "../schemas/quickPayment.schema";
import { UuidSchema } from "../schemas/uuid.schema";
import { PaginatedResult } from "../types";
import { StatusLoan, TypeLoan, TypeTransaction } from "../utils/Enums";
import { round } from "../utils/normalizarMoney";
import { TransactionService } from "./transactionService";
import { UserService } from "./userService";

export interface LoanSummary {
    lender: string;
    type: TypeLoan;
    totalAmount: number;
    totalPaid: number;
    totalRemaining: number;
    loanCount: number;
    status: 'PAID' | 'PENDING' | 'PARTIAL';
}

export interface LoanWithProgress {
    id: string;
    lender: string;
    type: TypeLoan;
    principalAmount: number;
    amountPaid: number;
    amountRemaining: number;
    percentagePaid: number;
    status: StatusLoan;
    startDate: Date;
    lastPaymentDate?: Date;
    paymentCount: number;
    description?: string;
    payments?: LoanPayment[]
}

interface PaymentCalculation {
    totalPaidInCents: number;
    totalPaid: number;
    totalRemaining: number;
    percentagePaid: number;
}

export class LoansService {
    private loanRepo = AppDataSourceProd.getRepository(Loan)
    private loanInstallmentRepo = AppDataSourceProd.getRepository(LoanInstallment)
    private loanPaymentRepo = AppDataSourceProd.getRepository(LoanPayment)
    private transactionRepo = AppDataSourceProd.getRepository(Transaction)
    private userService = new UserService()
    private transactionService = new TransactionService()

    /**
     * Calcula el total pagado, deuda restante y porcentaje de un préstamo
     * @param loan - Entidad del préstamo con pagos relacionados
     * @returns Objeto con cálculos normalizados (en dólares/soles)
     */
    private calculateLoanPaymentStatus(loan: Loan): PaymentCalculation {
        const totalPaidInCents = loan.payments?.reduce((sum, p) => sum + p.amount, 0) ?? 0
        const principalInCents = loan.principalAmount
        const totalPaid = totalPaidInCents / 100
        const principal = principalInCents / 100
        const totalRemaining = principal - totalPaid
        const percentagePaid = principal > 0 ? Math.round((totalPaid / principal) * 100) : 0

        return {
            totalPaidInCents,
            totalPaid: round(totalPaid),
            totalRemaining: round(Math.max(0, totalRemaining)),
            percentagePaid
        }
    }

    /**
     * Obtiene la última fecha de pago de un préstamo
     * @param loan - Entidad del préstamo
     * @returns Fecha del último pago o undefined
     */
    private getLastPaymentDate(loan: Loan): Date | undefined {
        if (!loan.payments || loan.payments.length === 0) return undefined
        return new Date(Math.max(...loan.payments.map(p => new Date(p.date).getTime())))
    }

    /**
     * Convierte una entidad Loan a LoanWithProgress
     * @param loan - Entidad del préstamo
     * @returns Objeto LoanWithProgress con todos los datos normalizados
     */
    private toLoanWithProgress(loan: Loan): LoanWithProgress {
        const payment = this.calculateLoanPaymentStatus(loan)

        return {
            id: loan.id,
            lender: loan.lender,
            type: loan.type,
            principalAmount: loan.principalAmount / 100,
            amountPaid: payment.totalPaid,
            amountRemaining: payment.totalRemaining,
            percentagePaid: payment.percentagePaid,
            status: loan.status,
            startDate: loan.startDate,
            lastPaymentDate: this.getLastPaymentDate(loan),
            paymentCount: loan.payments?.length ?? 0,
            description: loan.transactionReference?.description,
            payments: loan.payments.map(p => { return { ...p, amount: p.amount / 100 } })
        }
    }

    /**
     * Resumen de préstamos agrupados por acreedor/deudor
     * Permite ver de un vistazo cuánto deben/debes a cada persona
     */
    async getLoansSummary(userId: UuidSchema): Promise<LoanSummary[]> {
        try {
            const loans = await this.loanRepo.find({
                relations: ["payments"],
                where: { userId }
            })

            const summary = new Map<string, LoanSummary>()

            loans.forEach(loan => {
                const payment = this.calculateLoanPaymentStatus(loan)
                const key = `${loan.lender}_${loan.type}`

                if (summary.has(key)) {
                    const existing = summary.get(key)!
                    existing.totalAmount += loan.principalAmount / 100
                    existing.totalPaid += payment.totalPaid
                    existing.totalRemaining = round(existing.totalAmount - existing.totalPaid)
                    existing.loanCount += 1
                } else {
                    summary.set(key, {
                        lender: loan.lender,
                        type: loan.type,
                        totalAmount: loan.principalAmount / 100,
                        totalPaid: payment.totalPaid,
                        totalRemaining: payment.totalRemaining,
                        loanCount: 1,
                        status: loan.status
                    })
                }
            })

            return Array.from(summary.values()).sort((a, b) =>
                b.totalRemaining - a.totalRemaining
            )
        } catch (error) {
            throw new Error("Error al obtener resumen de préstamos: " + (error instanceof Error ? error.message : "Error desconocido"))
        }
    }

    /**
     * Préstamos de un deudor/acreedor específico
     * Vista detallada de cuaderno para cada persona
     */
    async getLoansByLender(userId: UuidSchema, lender: string, type: TypeLoan): Promise<LoanWithProgress[]> {
        try {
            const loans = await this.loanRepo.find({
                relations: ["payments"],
                where: { userId, lender, type }
            })

            return loans.map(loan => this.toLoanWithProgress(loan))
        } catch (error) {
            throw new Error(`Error al obtener préstamos con ${lender}: ${error instanceof Error ? error.message : "Error desconocido"}`)
        }
    }

    /**
     * Obtiene todos los préstamos del usuario con paginación
     */
    async getLoans(userId: UuidSchema, filters: PaginationQuerySchema): Promise<PaginatedResult<LoanWithProgress>> {
        try {
            const page = filters.page && filters.page > 0 ? filters.page : 1
            const limit = filters.limit && filters.limit > 0 ? filters.limit : 20
            const order = filters.order ?? 'DESC'

            const qb = this.loanRepo
                .createQueryBuilder('loan')
                .leftJoinAndSelect('loan.payments', 'payments')
                .where('loan.userId = :userId', { userId })
                .orderBy('loan.startDate', order)
                .skip((page - 1) * limit)
                .take(limit)

            const [loans, total] = await qb.getManyAndCount()

            const items = loans.map(loan => this.toLoanWithProgress(loan))

            return { items, total, page, limit }
        } catch (error) {
            throw new Error("Error al obtener préstamos: " + (error instanceof Error ? error.message : "Error desconocido"))
        }
    }

    /**
     * Obtiene un préstamo específico por ID
     */
    async getLoan(userId: UuidSchema, loanId: UuidSchema): Promise<LoanWithProgress> {
        try {
            const loan = await this.loanRepo.findOne({
                relations: ["payments"],
                where: { userId, id: loanId }
            })

            if (!loan) {
                throw new NotFoundError(`Préstamo con ID ${loanId} no encontrado para este usuario`)
            }

            return this.toLoanWithProgress(loan)
        } catch (error) {
            if (error instanceof NotFoundError) throw error
            throw new Error("Error al obtener préstamo: " + (error instanceof Error ? error.message : "Error desconocido"))
        }
    }

    /**
     * Crea un nuevo préstamo con su correspondiente transacción
     * @param userId - ID del usuario propietario del préstamo
     * @param loanData - Datos del préstamo a crear
     * @returns Préstamo creado con datos normalizados
     */
    async createLoan(userId: UuidSchema, loanData: LoanSchema): Promise<LoanWithProgress> {
        const queryRunner = AppDataSourceProd.createQueryRunner()
        await queryRunner.connect()
        await queryRunner.startTransaction()

        try {
            const user = await this.userService.getUserById(userId)

            if (!user) {
                throw new NotFoundError("Usuario no encontrado")
            }

            if (loanData.tea) {
                throw new ConflictError(
                    "Préstamos con tasa de interés bancaria no están implementados aún",
                    { tea: ["Esta funcionalidad será disponible próximamente"] }
                )
            }

            const transactionType = (loanData.type === TypeLoan.GIVEN)
                ? TypeTransaction.EXPENSE
                : TypeTransaction.INCOME

            const category = user.categories.find(
                cat => cat.name === "PRÉSTAMOS" && cat.type === transactionType
            )

            if (!category) {
                throw new NotFoundError(
                    `Categoría de préstamos no encontrada. Asegúrese de que existe una categoría "PRÉSTAMOS" de tipo ${transactionType}`
                )
            }

            // Crear transacción
            const transactionReferenceData = await this.transactionService.createTransaction({
                name: (loanData.type === TypeLoan.GIVEN)
                    ? `Préstamo a ${loanData.lender}`
                    : `Préstamo de ${loanData.lender}`,
                type: transactionType,
                amount: loanData.amount,
                date: loanData.startDate,
                time: loanData.time,
                categoryId: category.id,
                description: loanData.description,
                accountId: loanData.accountId
            }, userId)

            const transactionReference = queryRunner.manager.create(Transaction, transactionReferenceData);

            // Crear préstamo
            const loan = queryRunner.manager.create(Loan, {
                user,
                ...loanData,
                principalAmount: loanData.amount,
                transactionReference
            })

            const savedLoan = await queryRunner.manager.save(Loan, loan)

            // Actualizar referencia de transacción
            transactionReference.loan = savedLoan
            transactionReference.amount = loanData.amount // Ya está en centavos en la BD

            await queryRunner.manager.save(Transaction, transactionReference)

            await queryRunner.commitTransaction()

            return {
                id: savedLoan.id,
                lender: savedLoan.lender,
                type: savedLoan.type,
                principalAmount: savedLoan.principalAmount / 100,
                amountPaid: 0,
                amountRemaining: savedLoan.principalAmount / 100,
                percentagePaid: 0,
                status: savedLoan.status,
                startDate: savedLoan.startDate,
                paymentCount: 0,
                description: loanData.description,
            }
        } catch (error) {
            await queryRunner.rollbackTransaction()

            if (error instanceof NotFoundError || error instanceof ConflictError) {
                throw error
            }

            throw new Error(
                "Error al crear préstamo: " + (error instanceof Error ? error.message : "Error desconocido")
            )
        } finally {
            await queryRunner.release()
        }
    }

    /**
     * Registra un pago para un préstamo específico
     * @param userId - ID del usuario propietario del préstamo
     * @param loanId - ID del préstamo a pagar
     * @param data - Datos del pago
     * @returns Detalles del pago registrado
     */
    async payLoan(userId: UuidSchema, loanId: UuidSchema, data: LoanPaymentSchema): Promise<any> {
        const queryRunner = AppDataSourceProd.createQueryRunner()
        await queryRunner.connect()
        await queryRunner.startTransaction()

        try {
            const user = await this.userService.getUserById(userId)

            if (!user) {
                throw new NotFoundError("Usuario no encontrado")
            }

            const loan = await queryRunner.manager.findOne(Loan, {
                relations: ["payments"],
                where: { userId, id: loanId }
            })

            if (!loan) {
                throw new NotFoundError(`Préstamo con ID ${loanId} no encontrado para este usuario`)
            }

            // Validar estado del préstamo
            if (loan.status === StatusLoan.PAID) {
                throw new ConflictError(
                    `No se puede realizar un pago en un préstamo ya completamente pagado`,
                    { loan: ["Este préstamo ya fue pagado en su totalidad"] }
                )
            }

            // Calcular deuda actual
            const payment = this.calculateLoanPaymentStatus(loan)

            if (payment.totalPaidInCents >= loan.principalAmount) {
                throw new ConflictError(
                    "El préstamo ya está completamente pagado",
                    { loan: ["No hay saldo pendiente para pagar"] }
                )
            }

            const remainingInCents = loan.principalAmount - payment.totalPaidInCents

            // Validar monto del pago
            if (data.amount > remainingInCents) {
                const remainingInDollars = remainingInCents / 100
                throw new ConflictError(
                    `El monto del pago excede la deuda restante. Monto máximo: $${remainingInDollars.toFixed(2)}`,
                    { amount: [`No puede pagar más de $${remainingInDollars.toFixed(2)}. Deuda actual: $${remainingInDollars.toFixed(2)}`] }
                )
            }

            if (data.amount <= 0) {
                throw new ConflictError(
                    "El monto del pago debe ser mayor a 0",
                    { amount: ["Ingrese un monto válido"] }
                )
            }

            // Obtener categoría de devolución
            const transactionType = (loan.type === TypeLoan.GIVEN)
                ? TypeTransaction.INCOME
                : TypeTransaction.EXPENSE

            const category = user.categories.find(
                cat => cat.name === "DEVOLUCIÓN DE PRÉSTAMO" && cat.type === transactionType
            )

            if (!category) {
                throw new NotFoundError(
                    `Categoría de devolución no encontrada. Asegúrese de que existe una categoría "DEVOLUCIÓN DE PRÉSTAMO" de tipo ${transactionType}`
                )
            }

            // Crear transacción de pago
            const transactionData = await this.transactionService.createTransaction({
                name: (loan.type === TypeLoan.GIVEN)
                    ? `Pago de préstamo de ${loan.lender}`
                    : `Pago de préstamo a ${loan.lender}`,
                type: transactionType,
                amount: data.amount,
                date: data.date,
                time: data.time,
                description: data.description,
                categoryId: category.id,
                accountId: data.accountId
            }, user.id)

            const transaction = queryRunner.manager.create(Transaction, transactionData);

            // Crear registro de pago
            const loanPayment = queryRunner.manager.create(LoanPayment, {
                loan,
                ...data,
                transaction
            })

            const savedPayment = await queryRunner.manager.save(LoanPayment, loanPayment)

            // Actualizar transacción con referencia al pago
            transaction.loanPayment = savedPayment
            transaction.amount = data.amount

            await queryRunner.manager.save(Transaction, transaction)

            // Verificar si el préstamo está completamente pagado
            const updatedTotalPaidInCents = (await queryRunner.manager.sum(LoanPayment, 'amount', {
                loan: { id: loanId }
            })) || 0

            if (updatedTotalPaidInCents >= loan.principalAmount) {
                loan.status = StatusLoan.PAID
                await queryRunner.manager.save(loan)
            }

            await queryRunner.commitTransaction()

            return {
                id: savedPayment.id,
                loanId: loan.id,
                amount: data.amount / 100,
                date: data.date,
                transactionId: transaction.id
            }
        } catch (error) {
            await queryRunner.rollbackTransaction()

            if (error instanceof NotFoundError || error instanceof ConflictError) {
                throw error
            }

            throw new Error(
                "Error al registrar pago: " + (error instanceof Error ? error.message : "Error desconocido")
            )
        } finally {
            await queryRunner.release()
        }
    }

    /**
     * Realiza pagos rápidos contra múltiples préstamos con la misma persona
     * Distribuye el monto entre préstamos pendientes de forma automática
     * @param userId - ID del usuario
     * @param data - Datos del pago rápido (lender, type, amount)
     * @returns Array de pagos realizados
     */
    async quickPayMultipleLoans(userId: UuidSchema, data: QuickPaymentSchema): Promise<any[]> {
        const { lender, type, amount } = data

        if (amount <= 0) {
            throw new ConflictError(
                "El monto del pago debe ser mayor a 0",
                { amount: ["Ingrese un monto válido"] }
            )
        }

        try {
            const loans = await this.loanRepo.find({
                relations: ["payments"],
                where: { userId, lender, type, status: StatusLoan.PENDING }
            })

            if (loans.length === 0) {
                throw new NotFoundError(
                    `No hay préstamos pendientes con ${lender} de tipo ${type}`
                )
            }

            let remainingAmount = amount
            const payments: any[] = []
            const errors: string[] = []

            // Ordenar préstamos por fecha (más antiguos primero)
            loans.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())

            for (const loan of loans) {
                if (remainingAmount <= 0) break

                const payment = this.calculateLoanPaymentStatus(loan)
                const loanRemainingInCents = loan.principalAmount - payment.totalPaidInCents

                if (loanRemainingInCents <= 0) continue

                const paymentAmount = Math.min(remainingAmount, loanRemainingInCents)

                try {
                    const paymentData: LoanPaymentSchema = {
                        ...data,
                        amount: paymentAmount
                    }

                    const result = await this.payLoan(userId, loan.id, paymentData)
                    payments.push(result)
                    remainingAmount -= paymentAmount
                } catch (error: any) {
                    errors.push(
                        `Error al pagar préstamo ${loan.id} con ${lender}: ${error.message}`
                    )
                }
            }

            if (payments.length === 0 && errors.length > 0) {
                throw new Error(
                    `No se pudo procesar ningún pago. Detalles: ${errors.join("; ")}`
                )
            }

            if (remainingAmount > 0) {
                const amountDistributed = ((amount - remainingAmount) / 100).toFixed(2)
                throw new ConflictError(
                    `Saldo insuficiente en préstamos pendientes. Se pagó $${amountDistributed} de $${(amount / 100).toFixed(2)}`,
                    {
                        amount: [
                            `Monto solicitado: $${(amount / 100).toFixed(2)}`,
                            `Deuda total con ${lender}: $${amountDistributed}`,
                            `Saldo no aplicado: $${(remainingAmount / 100).toFixed(2)}`
                        ]
                    }
                )
            }

            return payments
        } catch (error) {
            if (error instanceof NotFoundError || error instanceof ConflictError) {
                throw error
            }

            throw new Error(
                "Error al realizar pagos múltiples: " + (error instanceof Error ? error.message : "Error desconocido")
            )
        }
    }
}