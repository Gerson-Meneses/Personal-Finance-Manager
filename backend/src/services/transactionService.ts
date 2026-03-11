import { AppDataSourceProd } from "../database/dataBaseDev";
import { Account } from "../entities/Account.entity";
import { Category } from "../entities/Category.entity";
import { ReccurentTransaction } from "../entities/ReccurentTransaction.entity";
import { Transaction } from "../entities/Transaction.entity";
import { User } from "../entities/User.entity";
import { BadRequestError, ConflictError, NotFoundError } from "../helpers/errors/domain.errors";
import { PaymentCreditCardSchema } from "../schemas/paymentCreditCard.schema";
import { TransactionSchema, UpdateTransactionSchema } from "../schemas/transaction.schema";
import { TransferSchema } from "../schemas/transfers.schema";
import { UuidSchema } from "../schemas/uuid.schema";
import { TypeAccount, TypeTransaction } from "../utils/Enums";
import { PaginatedResult } from "../types";
import { TransactionQuerySchema } from "../schemas/querysTransaction.schema";


export class TransactionService {
    private transactionRepo = AppDataSourceProd.getRepository(Transaction);
    private categoryRepo = AppDataSourceProd.getRepository(Category);
    private userRepo = AppDataSourceProd.getRepository(User);
    private accountRepo = AppDataSourceProd.getRepository(Account);
    private reccurentTransactionsRepo = AppDataSourceProd.getRepository(ReccurentTransaction);

    async getTransactions(
        userId: UuidSchema,
        filters: TransactionQuerySchema
    ): Promise<PaginatedResult<Transaction>> {

        const page = filters.page && filters.page > 0 ? filters.page : 1;
        const limit = filters.limit && filters.limit > 0 ? filters.limit : 20;
        const order = filters.order ?? 'DESC';

        const qb = this.transactionRepo
            .createQueryBuilder('t')
            .where('t.userId = :userId', { userId: userId });

        if (filters.type) {
            qb.andWhere('t.type = :type', { type: filters.type });
        }

        if (filters.accountId) {
            qb.andWhere('t.accountId = :accountId', { accountId: filters.accountId });
        }

        if (filters.relatedAccountId) {
            qb.andWhere('t.relatedAccountId = :relatedAccountId', { relatedAccountId: filters.relatedAccountId });
        }

        if (filters.categoryId) {
            qb.andWhere('t.categoryId = :categoryId', { categoryId: filters.categoryId });
        }

        if (filters.date) {
            qb.andWhere('DATE(t.date) = :date', { date: filters.date.toISOString().split('T')[0] });
        }

        if (filters.from && filters.to) {
            qb.andWhere('t.date BETWEEN :from AND :to', {
                from: filters.from,
                to: filters.to,
            });
        }

        if (filters.amount) {
            qb.andWhere('t.amount = :amount', { amount: filters.amount });
        }

        if (filters.minAmount) {
            qb.andWhere('t.amount >= :minAmount', { minAmount: filters.minAmount });
        }

        if (filters.maxAmount) {
            qb.andWhere('t.amount <= :maxAmount', { maxAmount: filters.maxAmount });
        }

        qb.orderBy('t.date', order)
            .skip((page - 1) * limit)
            .take(limit);

        let [transactions, total] = await qb.getManyAndCount();

        transactions = transactions.map(transaction => ({ ...transaction, amount: transaction.amount / 100 }))

        return {
            items: transactions,
            total,
            page,
            limit,
        };
    }



    async getTransactionById(id: UuidSchema, userId: UuidSchema): Promise<Transaction> {
        const transaction = await this.transactionRepo.findOne({ where: { id, user: { id: userId } }, relations: ['account', 'relatedAccount', 'category'] })
        if (!transaction) throw new NotFoundError("Transacción no encontrada para el usuario")
        return { ...transaction, amount: transaction.amount / 100 }
    }

    async createTransaction(transaction: TransactionSchema, userId: UuidSchema): Promise<Transaction> {
        const user = await this.userRepo.findOne({ where: { id: userId } })
        if (!user) throw new NotFoundError("Usuario no encontrado para asginar la creación de la transacción")

        console.log(transaction)

        const category = await this.categoryRepo.findOne({ where: { id: transaction.categoryId, user: { id: userId } } })
        if (!category) throw new NotFoundError("Categoria no encontrada o no pertence al usuario")
        if (category.type !== transaction.type) throw new ConflictError("Los tipos entre categoria y transacción no coinciden.")

        const account = await this.accountRepo.findOne({ where: { id: transaction.accountId, user: { id: userId } } })
        if (!account) throw new NotFoundError("Cuenta no encontrada o no pertenece al usuario.")

        if (transaction.isRecurrent) {
            // Logica para transacciones recurrentes aun no implementada
            throw new ConflictError("Logica para transacciones recurrentes aun no implementada")
        }

        switch (transaction.type) {
            case TypeTransaction.INCOME:
                if (account.type === TypeAccount.CREDIT) throw new ConflictError("No se pueden hacer ingresos a cuentas de tipo credito")
                account.balance += transaction.amount
                break
            case TypeTransaction.EXPENSE:
                if (account.balance < transaction.amount) throw new ConflictError("Sin saldo suficiente")
                account.balance -= transaction.amount
                break

            default: throw new ConflictError(`Tipo ${transaction.type} no valido.`)
        }

        await this.accountRepo.save(account)

        const newTransaction: Transaction = await this.transactionRepo.save({
            ...transaction,
            user,
            account,
            category
        })
        return { ...newTransaction, amount: newTransaction.amount / 100 }
    }

    async createTransfer(transaction: TransferSchema, userId: string): Promise<Transaction> {
        const { fromAccount, toAccount, ...rest } = transaction
        const user = await this.userRepo.findOne({ where: { id: userId } })
        if (!user) throw new NotFoundError("Usuario no encontrado para asginar la creación de la transacción")

        const fromAccountEntity = await this.accountRepo.findOne({ where: { name: fromAccount, user: { id: userId } } })
        if (!fromAccountEntity) throw new NotFoundError("Cuenta origen no encontrada o no pertenece al usuario")

        const toAccountEntity = await this.accountRepo.findOne({ where: { name: toAccount, user: { id: userId } } })
        if (!toAccountEntity) throw new NotFoundError("Cuenta destino no encontrada o no pertenece al usuario")

        if (fromAccountEntity.type === TypeAccount.CREDIT || toAccountEntity.type === TypeAccount.CREDIT) throw new ConflictError("No se pueden hacer transferencias a o desde cuentas de tipo credito")

        if (fromAccountEntity.id === toAccountEntity.id) throw new ConflictError("Las cuentas de origen y destino no pueden ser las mismas")

        if (fromAccountEntity.balance < transaction.amount) throw new ConflictError("Sin saldo suficiente en la cuenta origen")

        fromAccountEntity.balance -= transaction.amount
        toAccountEntity.balance += transaction.amount


        const newTransaction: Transaction = await this.transactionRepo.save({
            ...rest,
            name: `Transaferencia de ${fromAccountEntity.name} a ${toAccountEntity.name}`,
            type: TypeTransaction.TRANSFER,
            user,
            account: fromAccountEntity,
            relatedAccount: toAccountEntity
        })

        await this.accountRepo.save(fromAccountEntity)
        await this.accountRepo.save(toAccountEntity)

        return { ...newTransaction, amount: newTransaction.amount / 100 }
    }

    async makePayment(userId: string, creditCardId: string, payment: PaymentCreditCardSchema) {
        const user = await this.userRepo.findOne({ where: { id: userId } })
        if (!user) throw new NotFoundError("Usuario no encontrado")

        const relatedAccount = await this.accountRepo.findOne({ where: { id: creditCardId, user: { id: userId } } })
        if (!relatedAccount) throw new NotFoundError("Cuenta a pagar no encontrada o no pertenece al usuario")

        if (relatedAccount.type !== TypeAccount.CREDIT) throw new ConflictError("Solo se pueden hacer pagos a cuentas de tipo credito")

        const account = await this.accountRepo.findOne({ where: { name: payment.accountId, user: { id: userId }, type: TypeAccount.DEBIT || TypeAccount.CASH } })
        if (!account) throw new NotFoundError("Cuenta para pagar no encontrada o no pertenece al usuario o no es de tipo debito/cash")

        let withOverDraft = relatedAccount.creditLimit * ((relatedAccount.overdraft || 0) + 1)

        if (account.balance < payment.amount) throw new ConflictError("Sin saldo suficiente para hacer el pago")
        if (payment.amount > relatedAccount.balance && payment.amount > withOverDraft) throw new BadRequestError("El monto del pago excede el saldo de la tarjeta de crédito")
        if (payment.amount > (withOverDraft - relatedAccount.balance)) throw new BadRequestError("El monto de pago no puede ser mayor a la deuda registrada")

        account.balance -= payment.amount
        relatedAccount.balance += payment.amount

        await this.accountRepo.save(account)
        await this.accountRepo.save(relatedAccount)

        const newTransaction: Transaction = await this.transactionRepo.save({
            ...payment,
            name: `Pago tarjeta de crédito ${account.name}`,
            type: TypeTransaction.CREDIT_PAYMENT,
            user,
            account,
            relatedAccount
        })
        return { ...newTransaction, amount: newTransaction.amount / 100 }
    }

    async updateTransaction(id: UuidSchema, userId: UuidSchema, updateTransaction: UpdateTransactionSchema): Promise<Transaction> {
        const transaction = await this.transactionRepo.findOne({ where: { id, user: { id: userId } }, relations: ['account', 'relatedAccount'] })
        if (!transaction) throw new NotFoundError("Transacción no encontrada para el usuario")

        if (transaction.type === TypeTransaction.TRANSFER || transaction.type === TypeTransaction.CREDIT_PAYMENT) throw new ConflictError("No se pueden editar transacciones de tipo transferencia o pago de credito")

        if (updateTransaction.amount && transaction.amount !== updateTransaction.amount) {
            switch (transaction.type) {
                case TypeTransaction.INCOME:
                    transaction.account.balance -= transaction.amount
                    transaction.account.balance += updateTransaction.amount
                    break
                case TypeTransaction.EXPENSE:
                    transaction.account.balance += transaction.amount
                    transaction.account.balance -= updateTransaction.amount
                    break
            }
        }

        if (updateTransaction.category) {
            const category = await this.categoryRepo.findOne({ where: { name: updateTransaction.category, user: { id: userId } } })
            if (!category) throw new NotFoundError("Categoria no encontrada o no pertence al usuario")
            if (category.type !== transaction.type) throw new ConflictError("Los tipos entre categoria y transacción no coinciden.")
            transaction.category = category
        }

        Object.assign(transaction, updateTransaction)

        await this.accountRepo.save(transaction.account)
        await this.transactionRepo.save(transaction)

        return { ...transaction, amount: transaction.amount / 100 }
    }


    async deleteTransaction(id: UuidSchema, userId: UuidSchema): Promise<void> {
        const transaction = await this.transactionRepo.findOne({ where: { id, user: { id: userId } }, relations: ['account', 'relatedAccount'] })
        if (!transaction) throw new NotFoundError("Transacción no encontrada para el usuario")

        switch (transaction.type) {
            case TypeTransaction.INCOME:
                transaction.account.balance -= transaction.amount
                break
            case TypeTransaction.EXPENSE:
                transaction.account.balance += transaction.amount
                break
            case TypeTransaction.TRANSFER:
                transaction.account.balance += transaction.amount
                if (transaction.relatedAccount) transaction.relatedAccount.balance -= transaction.amount
                break
            case TypeTransaction.CREDIT_PAYMENT:
                transaction.account.balance += transaction.amount
                if (transaction.relatedAccount) transaction.relatedAccount.balance -= transaction.amount
                break
        }

        await this.accountRepo.save(transaction.account)
        if (transaction.relatedAccount) {
            await this.accountRepo.save(transaction.relatedAccount)
        }

        await this.transactionRepo.delete({ id, user: { id: userId } })
        return
    }

}