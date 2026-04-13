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
            .leftJoinAndSelect('t.account', 'account')
            .leftJoinAndSelect('t.relatedAccount', 'relatedAccount')
            .leftJoinAndSelect('t.category', 'category')
            .leftJoinAndSelect('t.loan', 'loan')
            .leftJoinAndSelect('t.loanPayment', 'loanPayment')
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
            qb.andWhere('DATE(t.date) = :date', { date: filters.date });
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

        transactions = transactions.map(transaction => ({ ...transaction, amount: transaction.amount / 100, account: { ...transaction.account, balance: transaction.account.balance / 100 }, relatedAccount: transaction.relatedAccount ? { ...transaction.relatedAccount, balance: transaction.relatedAccount.balance / 100 } : undefined }))

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
        const user = await this.userRepo.findOne({ where: { id: userId }, relations: ["credential"] });
        if (!user) throw new NotFoundError("Usuario no encontrado");

        const category = await this.categoryRepo.findOne({ where: { id: transaction.categoryId, user: { id: userId } } });
        if (!category) throw new NotFoundError("Categoría no encontrada");
        if (category.type !== transaction.type) throw new ConflictError("El tipo de categoría no coincide con la transacción.", { type: ["El tipo de categoría no coincide con la transacción."] });

        const account = await this.accountRepo.findOne({ where: { id: transaction.accountId, user: { id: userId } } });
        if (!account) throw new NotFoundError("Cuenta no encontrada");

        if (transaction.isRecurrent) throw new BadRequestError("Logica para transacciones recurrentes no implementad.")

        if (transaction.type === TypeTransaction.INCOME) {
            if (account.type === TypeAccount.CREDIT) throw new ConflictError("No se pueden hacer ingresos directos a cuentas de crédito.", { type: ["No se pueden hacer ingresos directos a cuentas de crédito."] });
            account.balance += transaction.amount;
        } else if (transaction.type === TypeTransaction.EXPENSE) {
            if (account.balance < transaction.amount) throw new ConflictError("Saldo insuficiente en la cuenta.", { amount: ["Monto no disponible en la cuenta."] });
            account.balance -= transaction.amount;
        }

        await this.accountRepo.save(account);

        const newTransaction = this.transactionRepo.create({
            ...transaction,
            user,
            account,
            category,
            isRecurrent: transaction.isRecurrent ?? false
        });

        const savedTransaction = await this.transactionRepo.save(newTransaction);

        return { ...savedTransaction, amount: savedTransaction.amount / 100 };
    }


    async createTransfer(transaction: TransferSchema, userId: string): Promise<Transaction> {
        const { fromAccount, toAccount, ...rest } = transaction
        const user = await this.userRepo.findOne({ where: { id: userId } })
        if (!user) throw new NotFoundError("Usuario no encontrado para asginar la creación de la transacción")

        const fromAccountEntity = await this.accountRepo.findOne({ where: { id: fromAccount, user: { id: userId } } })
        if (!fromAccountEntity) throw new NotFoundError("Cuenta origen no encontrada o no pertenece al usuario")

        const toAccountEntity = await this.accountRepo.findOne({ where: { id: toAccount, user: { id: userId } } })
        if (!toAccountEntity) throw new NotFoundError("Cuenta destino no encontrada o no pertenece al usuario")

        if (fromAccountEntity.type === TypeAccount.CREDIT || toAccountEntity.type === TypeAccount.CREDIT) throw new ConflictError("No se pueden hacer transferencias a o desde cuentas de tipo credito", { toAccount: ["No se pueden hacer transferencias a cuentas de tipo credito"], fromAccount: ["No se pueden hacer transferencias desde cuentas de tipo credito"] });

        if (fromAccountEntity.id === toAccountEntity.id) throw new ConflictError("Las cuentas de origen y destino no pueden ser las mismas", { toAccount: ["Las cuentas de origen y destino no pueden ser las mismas"] });

        const category = await this.categoryRepo.findOne({ where: { name: "TRANSFERENCIA", user: { id: userId } } })
        if (!category) throw new NotFoundError("Categoria no encontrada.")

        if (fromAccountEntity.balance < transaction.amount) throw new ConflictError("Sin saldo suficiente en la cuenta origen", { amount: ["Monto no disponible en la cuenta."] });

        fromAccountEntity.balance -= transaction.amount
        toAccountEntity.balance += transaction.amount


        const newTransaction: Transaction = await this.transactionRepo.save({
            ...rest,
            name: `Transaferencia de ${fromAccountEntity.name} a ${toAccountEntity.name}`,
            type: TypeTransaction.TRANSFER,
            user,
            category,
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

        if (relatedAccount.type !== TypeAccount.CREDIT) throw new ConflictError("Solo se pueden hacer pagos a cuentas de tipo credito", { creditCardId: ["Solo se pueden hacer pagos a cuentas de tipo credito"] })

        const account = await this.accountRepo.findOne({ where: { name: payment.accountId, user: { id: userId }, type: TypeAccount.DEBIT || TypeAccount.CASH } })
        if (!account) throw new NotFoundError("Cuenta para pagar no encontrada o no pertenece al usuario o no es de tipo debito/cash")

        let withOverDraft = relatedAccount.creditLimit * ((relatedAccount.overdraft || 0) + 1)

        if (account.balance < payment.amount) throw new ConflictError("Sin saldo suficiente para hacer el pago", { amount: ["Monto no disponible en la cuenta."] });
        if (payment.amount > relatedAccount.balance && payment.amount > withOverDraft) throw new BadRequestError("El monto del pago excede el saldo de la tarjeta de crédito", { amount: ["Monto excede el saldo de la tarjeta de crédito"] });
        if (payment.amount > (withOverDraft - relatedAccount.balance)) throw new BadRequestError("El monto de pago no puede ser mayor a la deuda registrada", { amount: ["Monto excede la deuda registrada"] });

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

    async updateTransaction(id: UuidSchema, userId: UuidSchema, updateData: UpdateTransactionSchema): Promise<Transaction> {

        const queryRunner = AppDataSourceProd.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        let updatedTransaction = {} as Transaction;

        try {

            // 1. Obtener la transacción con todas sus relaciones necesarias
            const transaction = await queryRunner.manager.findOne(Transaction, { where: { id, user: { id: userId } }, relations: ['account', 'relatedAccount', 'category'] });

            if (!transaction) throw new NotFoundError("Transacción no encontrada");

            // --- PASO A: REVERTIR EL IMPACTO ORIGINAL ---
            // Devolvemos el dinero a como estaba antes de esta transacción
            if (transaction.type === TypeTransaction.INCOME) {
                transaction.account.balance -= transaction.amount;
            } else if (transaction.type === TypeTransaction.EXPENSE) {
                transaction.account.balance += transaction.amount;
            } else if ([TypeTransaction.TRANSFER, TypeTransaction.CREDIT_PAYMENT].includes(transaction.type)) {
                transaction.account.balance += transaction.amount; // Devolvemos a la cuenta origen
                if (transaction.relatedAccount) {
                    transaction.relatedAccount.balance -= transaction.amount; // Quitamos de la cuenta destino
                }
            }

            await queryRunner.manager.save(transaction.account);
            if (transaction.relatedAccount) {
                await queryRunner.manager.save(transaction.relatedAccount);
            }
            console.log("Account after revert", transaction.account)
            // console.log("Related Account after revert", transaction.relatedAccount)

            // --- PASO B: ACTUALIZAR DATOS ---

            // Cambio de cuentas si se solicita
            if (updateData.accountId && updateData.accountId !== transaction.account.id) {
                const newAccount = await queryRunner.manager.findOne(Account, { where: { id: updateData.accountId, user: { id: userId } } });
                if (!newAccount) throw new NotFoundError("La cuenta principal no existe.");
                transaction.account = newAccount;
            }

            if (updateData.relatedAccountId && updateData.relatedAccountId !== transaction.relatedAccount?.id) {
                const newRelatedAccount = await queryRunner.manager.findOne(Account, { where: { id: updateData.relatedAccountId, user: { id: userId } } });
                if (!newRelatedAccount) throw new NotFoundError("La cuenta relacionada no existe.");
                transaction.relatedAccount = newRelatedAccount;
            }

            // Cambio de categoría
            if (updateData.categoryId) {
                const category = await queryRunner.manager.findOne(Category, { where: { id: updateData.categoryId, user: { id: userId } } });
                if (!category) throw new NotFoundError("La categoría no existe.");
                transaction.category = category;
            }

            // Actualizar campos básicos
            if (updateData.amount !== undefined) transaction.amount = updateData.amount;
            if (updateData.name) transaction.name = updateData.name;
            if (updateData.description) transaction.description = updateData.description;
            if (updateData.date) transaction.date = updateData.date; // Usamos el valor directo para evitar líos de zona horaria
            if (updateData.time) transaction.time = updateData.time;
            if (updateData.type) transaction.type = updateData.type;

            // --- PASO C: VALIDAR Y APLICAR NUEVO IMPACTO ---

            if (transaction.type === TypeTransaction.INCOME) {
                if (transaction.account.type === TypeAccount.CREDIT) throw new ConflictError("No se pueden hacer ingresos a cuentas de crédito.", { type: ["No se pueden hacer ingresos a cuentas de crédito."] });
                transaction.account.balance += transaction.amount;
            }
            else if (transaction.type === TypeTransaction.EXPENSE) {
                if (transaction.account.balance < transaction.amount) throw new ConflictError("Saldo insuficiente en la cuenta.", { accountId: ["Saldo insuficiente"] });
                transaction.account.balance -= transaction.amount;
            }
            else if (transaction.type === TypeTransaction.TRANSFER) {
                if (!transaction.relatedAccount) throw new BadRequestError("Una transferencia requiere una cuenta destino.");
                if (transaction.account.balance < transaction.amount) throw new ConflictError("Saldo insuficiente en cuenta origen.");

                transaction.account.balance -= transaction.amount;
                transaction.relatedAccount.balance += transaction.amount;
            }
            else if (transaction.type === TypeTransaction.CREDIT_PAYMENT) {
                if (!transaction.relatedAccount || transaction.relatedAccount.type !== TypeAccount.CREDIT) {
                    throw new ConflictError("El pago de crédito debe ser hacia una cuenta de tipo crédito.", { relatedAccountId: ["El pago de crédito debe ser hacia una cuenta de tipo crédito."] });
                }
                // Lógica de sobregiro (tomada de tu makePayment)
                let withOverDraft = transaction.relatedAccount.creditLimit * ((transaction.relatedAccount.overdraft || 0) + 1);
                let debt = withOverDraft - transaction.relatedAccount.balance;

                if (transaction.account.balance < transaction.amount) throw new ConflictError("Saldo insuficiente para el pago.", { amount: ["Monto no disponible en la cuenta."] });
                if (transaction.amount > debt) throw new BadRequestError("El pago excede la deuda de la tarjeta.", { amount: ["Monto excede la deuda registrada"] });

                transaction.account.balance -= transaction.amount;
                transaction.relatedAccount.balance += transaction.amount;
            }

            await queryRunner.manager.save(transaction.account);
            if (transaction.relatedAccount) {
                await queryRunner.manager.save(transaction.relatedAccount);
            }

            updatedTransaction = await queryRunner.manager.save(transaction);

            await queryRunner.commitTransaction();

        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
        return { ...updatedTransaction, amount: updatedTransaction.amount / 100 };
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