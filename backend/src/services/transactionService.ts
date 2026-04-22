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
import { In } from "typeorm";

export class TransactionService {
    private transactionRepo = AppDataSourceProd.getRepository(Transaction);

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

        // Convertir centavos a unidades para respuesta
        transactions = transactions.map(transaction => ({
            ...transaction,
            amount: transaction.amount / 100,
            account: {
                ...transaction.account,
                balance: transaction.account.balance / 100
            },
            relatedAccount: transaction.relatedAccount ? {
                ...transaction.relatedAccount,
                balance: transaction.relatedAccount.balance / 100
            } : undefined
        }))

        return {
            items: transactions,
            total,
            page,
            limit,
        };
    }

   
    async getTransactionById(id: UuidSchema, userId: UuidSchema): Promise<Transaction> {
        const transaction = await this.transactionRepo.findOne({
            where: { id, user: { id: userId } },
            relations: ['account', 'relatedAccount', 'category']
        })
        if (!transaction) throw new NotFoundError("Transacción no encontrada para el usuario")
        return { ...transaction, amount: transaction.amount / 100 }
    }

    async createTransaction(transaction: TransactionSchema, userId: UuidSchema): Promise<Transaction> {
        const queryRunner = AppDataSourceProd.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
        
            const user = await queryRunner.manager.findOne(User, {
                where: { id: userId },
                relations: ["credential"]
            });
            if (!user) throw new NotFoundError("Usuario no encontrado");

            const category = await queryRunner.manager.findOne(Category, {
                where: { id: transaction.categoryId, user: { id: userId } }
            });
            if (!category) throw new NotFoundError("Categoría no encontrada");
            if (category.type !== transaction.type) {
                throw new ConflictError("El tipo de categoría no coincide con la transacción.", {
                    type: ["El tipo de categoría no coincide con la transacción."]
                });
            }

            const account = await queryRunner.manager.findOne(Account, {
                where: { id: transaction.accountId, user: { id: userId } }
            });
            if (!account) throw new NotFoundError("Cuenta no encontrada");

            if (transaction.isRecurrent) {
                throw new BadRequestError("Lógica para transacciones recurrentes no implementada.");
            }

            if (transaction.type === TypeTransaction.INCOME) {
                if (account.type === TypeAccount.CREDIT) {
                    throw new ConflictError("No se pueden hacer ingresos directos a cuentas de crédito.", {
                        type: ["No se pueden hacer ingresos directos a cuentas de crédito."]
                    });
                }
                account.balance += transaction.amount; 
            } else if (transaction.type === TypeTransaction.EXPENSE) {
                if (account.balance < transaction.amount) {
                    throw new ConflictError("Saldo insuficiente en la cuenta.", {
                        amount: ["Monto no disponible en la cuenta."]
                    });
                }
                account.balance -= transaction.amount;
            }

            await queryRunner.manager.save(account);

            const newTransaction = queryRunner.manager.create(Transaction, {
                ...transaction,
                user,
                account,
                category,
                isRecurrent: transaction.isRecurrent ?? false
            });

            const savedTransaction = await queryRunner.manager.save(newTransaction);
            await queryRunner.commitTransaction();

            return { ...savedTransaction, amount: savedTransaction.amount / 100 };
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async createTransfer(transaction: TransferSchema, userId: string): Promise<Transaction> {
        const queryRunner = AppDataSourceProd.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const { fromAccount, toAccount, ...rest } = transaction;

            const user = await queryRunner.manager.findOne(User, {
                where: { id: userId }
            });
            if (!user) throw new NotFoundError("Usuario no encontrado para asignar la creación de la transacción");

            const fromAccountEntity = await queryRunner.manager.findOne(Account, {
                where: { id: fromAccount, user: { id: userId } }
            });
            if (!fromAccountEntity) throw new NotFoundError("Cuenta origen no encontrada o no pertenece al usuario");

            const toAccountEntity = await queryRunner.manager.findOne(Account, {
                where: { id: toAccount, user: { id: userId } }
            });
            if (!toAccountEntity) throw new NotFoundError("Cuenta destino no encontrada o no pertenece al usuario");

            if (fromAccountEntity.type === TypeAccount.CREDIT || toAccountEntity.type === TypeAccount.CREDIT) {
                throw new ConflictError("No se pueden hacer transferencias a o desde cuentas de tipo crédito", {
                    toAccount: ["No se pueden hacer transferencias a cuentas de tipo crédito"],
                    fromAccount: ["No se pueden hacer transferencias desde cuentas de tipo crédito"]
                });
            }

            if (fromAccountEntity.id === toAccountEntity.id) {
                throw new ConflictError("Las cuentas de origen y destino no pueden ser las mismas", {
                    toAccount: ["Las cuentas de origen y destino no pueden ser las mismas"]
                });
            }

            const category = await queryRunner.manager.findOne(Category, {
                where: { name: "TRANSFERENCIA", user: { id: userId } }
            });
            if (!category) throw new NotFoundError("Categoría no encontrada.");

            if (fromAccountEntity.balance < transaction.amount) {
                throw new ConflictError("Sin saldo suficiente en la cuenta origen", {
                    amount: ["Monto no disponible en la cuenta."]
                });
            }

            fromAccountEntity.balance -= transaction.amount;
            toAccountEntity.balance += transaction.amount;

            const newTransaction: Transaction = queryRunner.manager.create(Transaction, {
                ...rest,
                name: `Transferencia de ${fromAccountEntity.name} a ${toAccountEntity.name}`,
                type: TypeTransaction.TRANSFER,
                user,
                category,
                account: fromAccountEntity,
                relatedAccount: toAccountEntity
            });

            await queryRunner.manager.save(fromAccountEntity);
            await queryRunner.manager.save(toAccountEntity);
            const savedTransaction = await queryRunner.manager.save(newTransaction);

            await queryRunner.commitTransaction();

            return { ...savedTransaction, amount: savedTransaction.amount / 100 };
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async makePayment(userId: string, creditCardId: string, payment: PaymentCreditCardSchema): Promise<Transaction> {
        const queryRunner = AppDataSourceProd.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {

            const user = await queryRunner.manager.findOne(User, {
                where: { id: userId }
            });
            if (!user) throw new NotFoundError("Usuario no encontrado");

            const relatedAccount = await queryRunner.manager.findOne(Account, {
                where: { id: creditCardId, user: { id: userId } }
            });
            if (!relatedAccount) throw new NotFoundError("Cuenta a pagar no encontrada o no pertenece al usuario");

            if (relatedAccount.type !== TypeAccount.CREDIT) {
                throw new ConflictError("Solo se pueden hacer pagos a cuentas de tipo crédito", {
                    creditCardId: ["Solo se pueden hacer pagos a cuentas de tipo crédito"]
                });
            }

            const account = await queryRunner.manager.findOne(Account, {
                where: {
                    id: payment.accountId,
                    user: { id: userId },
                    type: In([TypeAccount.DEBIT, TypeAccount.CASH])
                }
            });
            if (!account) throw new NotFoundError("Cuenta para pagar no encontrada o no pertenece al usuario o no es de tipo débito/cash");

            const withOverDraft = relatedAccount.creditLimit * ((relatedAccount.overdraft || 0) + 1);
            const debt = withOverDraft - relatedAccount.balance;

            if (account.balance < payment.amount) {
                throw new ConflictError("Sin saldo suficiente para hacer el pago", {
                    amount: ["Monto no disponible en la cuenta."]
                });
            }

            if (payment.amount > debt) {
                throw new BadRequestError("El monto del pago no puede ser mayor a la deuda registrada", {
                    amount: ["Monto excede la deuda registrada"]
                });
            }

            account.balance -= payment.amount;
            relatedAccount.balance += payment.amount;

            await queryRunner.manager.save(account);
            await queryRunner.manager.save(relatedAccount);

            const category = await queryRunner.manager.findOne(Category, {
                where: { name: "PAGO DE TARJETA", user: { id: userId } }
            });
            if (!category) throw new NotFoundError("Categoría de pago de tarjeta no encontrada.");

            const newTransaction: Transaction = queryRunner.manager.create(Transaction, {
                ...payment,
                name: `Pago tarjeta de crédito ${relatedAccount.name}`,
                type: TypeTransaction.CREDIT_PAYMENT,
                user,
                account,
                relatedAccount,
                category
            });

            const savedTransaction = await queryRunner.manager.save(newTransaction);
            await queryRunner.commitTransaction();

            return { ...savedTransaction, amount: savedTransaction.amount / 100 };
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async updateTransaction(id: UuidSchema, userId: UuidSchema, updateData: UpdateTransactionSchema): Promise<Transaction> {
        const queryRunner = AppDataSourceProd.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        let updatedTransaction = {} as Transaction;

        try {
    
            const transaction = await queryRunner.manager.findOne(Transaction, {
                where: { id, user: { id: userId } },
                relations: ['account', 'relatedAccount', 'category']
            });

            if (!transaction) throw new NotFoundError("Transacción no encontrada");

            if (transaction.type === TypeTransaction.INCOME) {
                transaction.account.balance -= transaction.amount;
            } else if (transaction.type === TypeTransaction.EXPENSE) {
                transaction.account.balance += transaction.amount;
            } else if ([TypeTransaction.TRANSFER, TypeTransaction.CREDIT_PAYMENT].includes(transaction.type)) {
                transaction.account.balance += transaction.amount;
                if (transaction.relatedAccount) {
                    transaction.relatedAccount.balance -= transaction.amount;
                }
            }

            await queryRunner.manager.save(transaction.account);
            if (transaction.relatedAccount) {
                await queryRunner.manager.save(transaction.relatedAccount);
            }

            if (updateData.accountId && updateData.accountId !== transaction.account.id) {
                const newAccount = await queryRunner.manager.findOne(Account, {
                    where: { id: updateData.accountId, user: { id: userId } }
                });
                if (!newAccount) throw new NotFoundError("La cuenta principal no existe.");
                transaction.account = newAccount;
            }

            if (updateData.relatedAccountId && updateData.relatedAccountId !== transaction.relatedAccount?.id) {
                const newRelatedAccount = await queryRunner.manager.findOne(Account, {
                    where: { id: updateData.relatedAccountId, user: { id: userId } }
                });
                if (!newRelatedAccount) throw new NotFoundError("La cuenta relacionada no existe.");
                transaction.relatedAccount = newRelatedAccount;
            }

            if (updateData.categoryId) {
                const category = await queryRunner.manager.findOne(Category, {
                    where: { id: updateData.categoryId, user: { id: userId } }
                });
                if (!category) throw new NotFoundError("La categoría no existe.");
                transaction.category = category;
            }

            if (updateData.amount !== undefined) transaction.amount = updateData.amount;
            if (updateData.name) transaction.name = updateData.name;
            if (updateData.description) transaction.description = updateData.description;
            if (updateData.date) transaction.date = updateData.date;
            if (updateData.time) transaction.time = updateData.time;
            if (updateData.type) transaction.type = updateData.type;

            if (transaction.type === TypeTransaction.INCOME) {
                if (transaction.account.type === TypeAccount.CREDIT) {
                    throw new ConflictError("No se pueden hacer ingresos a cuentas de crédito.", {
                        type: ["No se pueden hacer ingresos a cuentas de crédito."]
                    });
                }
                transaction.account.balance += transaction.amount;
            }
            else if (transaction.type === TypeTransaction.EXPENSE) {
                if (transaction.account.balance < transaction.amount) {
                    throw new ConflictError("Saldo insuficiente en la cuenta.", {
                        accountId: ["Saldo insuficiente"]
                    });
                }
                transaction.account.balance -= transaction.amount;
            }
            else if (transaction.type === TypeTransaction.TRANSFER) {
                if (!transaction.relatedAccount) throw new BadRequestError("Una transferencia requiere una cuenta destino.");
                if (transaction.account.balance < transaction.amount) {
                    throw new ConflictError("Saldo insuficiente en cuenta origen.");
                }

                transaction.account.balance -= transaction.amount;
                transaction.relatedAccount.balance += transaction.amount;
            }
            else if (transaction.type === TypeTransaction.CREDIT_PAYMENT) {
                if (!transaction.relatedAccount || transaction.relatedAccount.type !== TypeAccount.CREDIT) {
                    throw new ConflictError("El pago de crédito debe ser hacia una cuenta de tipo crédito.", {
                        relatedAccountId: ["El pago de crédito debe ser hacia una cuenta de tipo crédito."]
                    });
                }

                const withOverDraft = transaction.relatedAccount.creditLimit * ((transaction.relatedAccount.overdraft || 0) + 1);
                const debt = withOverDraft - transaction.relatedAccount.balance;

                if (transaction.account.balance < transaction.amount) {
                    throw new ConflictError("Saldo insuficiente para el pago.", {
                        amount: ["Monto no disponible en la cuenta."]
                    });
                }
                if (transaction.amount > debt) {
                    throw new BadRequestError("El pago excede la deuda de la tarjeta.", {
                        amount: ["Monto excede la deuda registrada"]
                    });
                }

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
        const queryRunner = AppDataSourceProd.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const transaction = await queryRunner.manager.findOne(Transaction, {
                where: { id, user: { id: userId } },
                relations: ['account', 'relatedAccount']
            });
            if (!transaction) throw new NotFoundError("Transacción no encontrada para el usuario");

            // Revertir impacto en cuentas según tipo
            switch (transaction.type) {
                case TypeTransaction.INCOME:
                    transaction.account.balance -= transaction.amount;
                    break;
                case TypeTransaction.EXPENSE:
                    transaction.account.balance += transaction.amount;
                    break;
                case TypeTransaction.TRANSFER:
                    transaction.account.balance += transaction.amount;
                    if (transaction.relatedAccount) transaction.relatedAccount.balance -= transaction.amount;
                    break;
                case TypeTransaction.CREDIT_PAYMENT:
                    transaction.account.balance += transaction.amount;
                    if (transaction.relatedAccount) transaction.relatedAccount.balance -= transaction.amount;
                    break;
            }

            await queryRunner.manager.save(transaction.account);
            if (transaction.relatedAccount) {
                await queryRunner.manager.save(transaction.relatedAccount);
            }

            await queryRunner.manager.delete(Transaction, { id, user: { id: userId } });
            await queryRunner.commitTransaction();
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }
}