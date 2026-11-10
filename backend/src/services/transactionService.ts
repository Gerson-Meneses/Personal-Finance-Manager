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
import { EntityManager, QueryRunner, SelectQueryBuilder } from "typeorm";
import { toTransactionResponse } from "../mappers/TransactionMapper";
import { TransactionResponse, TransactionStatsResponse } from "../ResponseInterfaces/TransactionInterface";
import { money } from "../utils/normalizarMoney";

type BalanceState = {
    type: TypeTransaction;
    amount: number;
    account: Account;
    relatedAccount?: Account | null;
};

export class TransactionService {
    private transactionRepo = AppDataSourceProd.getRepository(Transaction);

    /**
     * Efecto puro de una transacción sobre los saldos: accountId -> delta.
     * INCOME  -> cuenta +
     * EXPENSE -> cuenta -
     * TRANSFER / CREDIT_PAYMENT -> origen -, destino +
     */
    private computeBalanceEffect(state: BalanceState): Map<string, number> {
        const effect = new Map<string, number>();
        const add = (account: Account | null | undefined, delta: number) => {
            if (!account) return;
            effect.set(account.id, (effect.get(account.id) ?? 0) + delta);
        };

        switch (state.type) {
            case TypeTransaction.INCOME:
                add(state.account, state.amount);
                break;
            case TypeTransaction.EXPENSE:
                add(state.account, -state.amount);
                break;
            case TypeTransaction.TRANSFER:
            case TypeTransaction.CREDIT_PAYMENT:
                add(state.account, -state.amount);
                add(state.relatedAccount, state.amount);
                break;
        }
        return effect;
    }

    /**
     * Bloquea (SELECT ... FOR UPDATE) las cuentas indicadas dentro de la transacción
     * actual, respetando el ownership del usuario. Los ids se ordenan para
     * serializar el bloqueo en un orden estable y evitar deadlocks.
     * Devuelve un mapa id -> cuenta; el caller decide si falta alguna.
     */
    private async lockAccounts(
        manager: EntityManager,
        accountIds: Array<string | null | undefined>,
        userId: UuidSchema
    ): Promise<Map<string, Account>> {
        const uniqueIds = [...new Set(accountIds.filter((id): id is string => !!id))].sort();
        if (uniqueIds.length === 0) return new Map();

        const accounts = await manager
            .createQueryBuilder(Account, 'account')
            .where('account.id IN (:...ids)', { ids: uniqueIds })
            .andWhere('account.userId = :userId', { userId })
            .setLock('pessimistic_write')
            .getMany();

        return new Map(accounts.map((account) => [account.id, account]));
    }

    /**
     * Bloquea la fila de la transacción para serializar updates concurrentes
     * sobre la misma. Debe llamarse ANTES de leer el estado actual.
     */
    private async lockTransactionRow(manager: EntityManager, id: UuidSchema, userId: UuidSchema): Promise<void> {
        const locked = await manager
            .createQueryBuilder(Transaction, 't')
            .select('t.id')
            .where('t.id = :id', { id })
            .andWhere('t.userId = :userId', { userId })
            .setLock('pessimistic_write')
            .getOne();

        if (!locked) throw new NotFoundError('Transacción no encontrada');
    }

    /** Construye la consulta base y aplica todos los filtros del listado. */
    private buildTransactionQuery(
        userId: UuidSchema,
        filters: TransactionQuerySchema
    ): SelectQueryBuilder<Transaction> {
        const qb = this.transactionRepo
            .createQueryBuilder('t')
            .leftJoinAndSelect('t.account', 'account')
            .leftJoinAndSelect('t.relatedAccount', 'relatedAccount')
            .leftJoinAndSelect('t.category', 'category')
            .leftJoinAndSelect('t.loan', 'loan')
            .leftJoinAndSelect('t.loanPayment', 'loanPayment')
            .where('t.userId = :userId', { userId });

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

        if (filters.search) {
            qb.andWhere(
                `(
                    t.name ILIKE :search
                    OR t.description ILIKE :search
                    OR category.name ILIKE :search
                    OR account.name ILIKE :search
                    OR relatedAccount.name ILIKE :search
                )`,
                { search: `%${filters.search}%` }
            );
        }

        if (filters.date) {
            qb.andWhere('t.date = :date', { date: filters.date });
        }

        // from y to son independientes: sirve para "desde X" o "hasta Y"
        if (filters.from) {
            qb.andWhere('t.date >= :from', { from: filters.from });
        }

        if (filters.to) {
            qb.andWhere('t.date <= :to', { to: filters.to });
        }

        if (filters.amount) {
            qb.andWhere('t.amount = :amount', { amount: filters.amount });
        }

        if (filters.minAmount !== undefined && filters.minAmount !== null) {
            qb.andWhere('t.amount >= :minAmount', { minAmount: filters.minAmount });
        }

        if (filters.maxAmount !== undefined && filters.maxAmount !== null) {
            qb.andWhere('t.amount <= :maxAmount', { maxAmount: filters.maxAmount });
        }

        return qb;
    }

    async getTransactions(
        userId: UuidSchema,
        filters: TransactionQuerySchema
    ): Promise<PaginatedResult<TransactionResponse>> {

        const page = filters.page && filters.page > 0 ? filters.page : 1;
        const limit = filters.limit && filters.limit > 0 ? filters.limit : 20;
        const order = filters.order ?? 'DESC';
        const orderBy = filters.orderBy ?? 'date';

        const orderByMap: Record<string, string> = {
            date: 't.date',
            amount: 't.amount',
            name: 't.name',
            createdAt: 't.createdAt',
        };

        const qb = this.buildTransactionQuery(userId, filters)
            .orderBy(orderByMap[orderBy] ?? 't.date', order)
            .addOrderBy('t.id', order)
            .skip((page - 1) * limit)
            .take(limit);

        const [transactions, total] = await qb.getManyAndCount();

        const transactionsResponse = transactions.map(tx => toTransactionResponse(tx))

        return {
            items: transactionsResponse,
            total,
            page,
            limit,
        };
    }

    async getTransactionsStats(
        userId: UuidSchema,
        filters: TransactionQuerySchema
    ): Promise<TransactionStatsResponse> {
        const raw = await this.buildTransactionQuery(userId, filters)
            .select('COUNT(t.id)', 'count')
            .addSelect(
                `COALESCE(SUM(CASE WHEN t.type = '${TypeTransaction.INCOME}' THEN t.amount ELSE 0 END), 0)`,
                'income'
            )
            .addSelect(
                `COALESCE(SUM(CASE WHEN t.type = '${TypeTransaction.EXPENSE}' THEN t.amount ELSE 0 END), 0)`,
                'expense'
            )
            .addSelect(
                `COALESCE(SUM(CASE WHEN t.type = '${TypeTransaction.TRANSFER}' THEN t.amount ELSE 0 END), 0)`,
                'transfers'
            )
            .addSelect(
                `COALESCE(SUM(CASE WHEN t.type = '${TypeTransaction.CREDIT_PAYMENT}' THEN t.amount ELSE 0 END), 0)`,
                'creditPayments'
            )
            .getRawOne<{ count: string; income: string; expense: string; transfers: string; creditPayments: string }>();

        const incomeCents = Number(raw?.income ?? 0);
        const expenseCents = Number(raw?.expense ?? 0);

        return {
            count: Number(raw?.count ?? 0),
            income: money(incomeCents),
            expense: money(expenseCents),
            net: money(incomeCents - expenseCents),
            transfers: money(Number(raw?.transfers ?? 0)),
            creditPayments: money(Number(raw?.creditPayments ?? 0)),
        };
    }


    async getTransactionById(id: UuidSchema, userId: UuidSchema): Promise<TransactionResponse> {
        const transaction = await this.transactionRepo.findOne({
            where: { id, user: { id: userId } },
            relations: ['account', 'relatedAccount', 'category']
        })
        if (!transaction) throw new NotFoundError("Transacción no encontrada para el usuario")
        return toTransactionResponse(transaction)
    }

    async createTransaction(transaction: TransactionSchema, userId: UuidSchema,moneyAmount: boolean = true, entityManager?: EntityManager): Promise<TransactionResponse> {

        let queryRunner: QueryRunner | undefined;
        let manager: EntityManager;
        let isOwnTransaction = false;

        if (!entityManager) {
            queryRunner = AppDataSourceProd.createQueryRunner();
            await queryRunner.connect();
            await queryRunner.startTransaction();
            manager = queryRunner.manager;
            isOwnTransaction = true;
        } else {
            manager = entityManager;
        }

        try {

            const user = await manager.findOne(User, {
                where: { id: userId }
            });
            if (!user) throw new NotFoundError("Usuario no encontrado");

            const category = await manager.findOne(Category, {
                where: { id: transaction.categoryId, user: { id: userId } }
            });
            if (!category) throw new NotFoundError("Categoría no encontrada");
            if (category.type !== transaction.type) {
                throw new ConflictError("El tipo de categoría no coincide con la transacción.", {
                    type: ["El tipo de categoría no coincide con la transacción."]
                });
            }

            const accountsById = await this.lockAccounts(manager, [transaction.accountId], userId);
            const account = accountsById.get(transaction.accountId);
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

            await manager.save(account);

            const newTransaction = manager.create(Transaction, {
                ...transaction,
                user,
                account,
                category,
                isRecurrent: transaction.isRecurrent ?? false
            });

            const savedTransaction = await manager.save(newTransaction);

            if (isOwnTransaction && queryRunner) {
                await queryRunner.commitTransaction();
            }
            return toTransactionResponse(savedTransaction, { moneyAmount });
        } catch (error) {
            if (isOwnTransaction && queryRunner) {
                await queryRunner.rollbackTransaction();
            }
            if (error instanceof NotFoundError || error instanceof ConflictError) {
                throw error;
            }
            if (error instanceof BadRequestError) {
                throw error;
            }
            const errorMessage =
                error instanceof Error ? error.message : "Error desconocido";
            throw new Error(`Error al registrar la transacción: ${errorMessage}`);
        } finally {
            if (isOwnTransaction && queryRunner) {
                await queryRunner.release();
            }
        }
    }

    async createTransfer(transaction: TransferSchema, userId: string): Promise<TransactionResponse> {
        const queryRunner = AppDataSourceProd.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const { fromAccount, toAccount, ...rest } = transaction;

            const user = await queryRunner.manager.findOne(User, {
                where: { id: userId }
            });
            if (!user) throw new NotFoundError("Usuario no encontrado para asignar la creación de la transacción");

            const accountsById = await this.lockAccounts(queryRunner.manager, [fromAccount, toAccount], userId);

            const fromAccountEntity = accountsById.get(fromAccount);
            if (!fromAccountEntity) throw new NotFoundError("Cuenta origen no encontrada o no pertenece al usuario");

            const toAccountEntity = accountsById.get(toAccount);
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

            return toTransactionResponse(savedTransaction);
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async makePayment(userId: string, creditCardId: string, payment: PaymentCreditCardSchema): Promise<TransactionResponse> {
        const queryRunner = AppDataSourceProd.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {

            const user = await queryRunner.manager.findOne(User, {
                where: { id: userId }
            });
            if (!user) throw new NotFoundError("Usuario no encontrado");

            const accountsById = await this.lockAccounts(queryRunner.manager, [creditCardId, payment.accountId], userId);

            const relatedAccount = accountsById.get(creditCardId);
            if (!relatedAccount) throw new NotFoundError("Cuenta a pagar no encontrada o no pertenece al usuario");

            if (relatedAccount.type !== TypeAccount.CREDIT) {
                throw new ConflictError("Solo se pueden hacer pagos a cuentas de tipo crédito", {
                    creditCardId: ["Solo se pueden hacer pagos a cuentas de tipo crédito"]
                });
            }

            const account = accountsById.get(payment.accountId);
            if (!account || ![TypeAccount.DEBIT, TypeAccount.CASH].includes(account.type)) {
                throw new NotFoundError("Cuenta para pagar no encontrada o no pertenece al usuario o no es de tipo débito/cash");
            }

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

            return toTransactionResponse(savedTransaction);
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async updateTransaction(id: UuidSchema, userId: UuidSchema, updateData: UpdateTransactionSchema): Promise<TransactionResponse> {
        const queryRunner = AppDataSourceProd.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const manager = queryRunner.manager;

            // 1) Bloquear la fila de la transacción ANTES de leer su estado,
            //    para que updates concurrentes se serialicen y el segundo lea
            //    el estado ya confirmado del primero.
            await this.lockTransactionRow(manager, id, userId);

            const transaction = await manager.findOne(Transaction, {
                where: { id, user: { id: userId } },
                relations: ['account', 'relatedAccount', 'category']
            });
            if (!transaction) throw new NotFoundError("Transacción no encontrada");

            // 2) Estado actual (old*) y estado deseado (next*)
            const oldType = transaction.type;
            const oldAmount = transaction.amount;
            const oldAccountId = transaction.account.id;
            const oldRelatedAccountId = transaction.relatedAccount?.id ?? null;

            const nextType = updateData.type ?? transaction.type;
            const nextAmount = updateData.amount ?? transaction.amount;
            const usesRelatedAccount =
                nextType === TypeTransaction.TRANSFER || nextType === TypeTransaction.CREDIT_PAYMENT;

            const nextAccountId = updateData.accountId ?? oldAccountId;
            let nextRelatedAccountId: string | null = null;

            if (usesRelatedAccount) {
                nextRelatedAccountId = updateData.relatedAccountId ?? oldRelatedAccountId;
                if (!nextRelatedAccountId) {
                    throw new BadRequestError("Esta transacción requiere una cuenta relacionada.");
                }
                if (nextRelatedAccountId === nextAccountId) {
                    throw new ConflictError("Las cuentas de origen y destino no pueden ser las mismas", {
                        relatedAccountId: ["Las cuentas de origen y destino no pueden ser las mismas"]
                    });
                }
            }

            // 3) Bloquear (FOR UPDATE) todas las cuentas involucradas en el
            //    estado viejo o nuevo, en orden estable para evitar deadlocks.
            const accountsById = await this.lockAccounts(
                manager,
                [oldAccountId, oldRelatedAccountId, nextAccountId, nextRelatedAccountId],
                userId
            );

            const requireAccount = (accountId: string): Account => {
                const account = accountsById.get(accountId);
                if (!account) throw new NotFoundError("Cuenta no encontrada o no pertenece al usuario");
                return account;
            };

            const oldAccount = requireAccount(oldAccountId);
            const oldRelatedAccount = oldRelatedAccountId ? requireAccount(oldRelatedAccountId) : null;
            const nextAccount = requireAccount(nextAccountId);
            const nextRelatedAccount = nextRelatedAccountId ? requireAccount(nextRelatedAccountId) : null;

            // 4) Categoría: validar ownership y que su tipo coincida con el nuevo tipo
            let nextCategory = transaction.category;
            if (updateData.categoryId && updateData.categoryId !== transaction.category?.id) {
                const category = await manager.findOne(Category, {
                    where: { id: updateData.categoryId, user: { id: userId } }
                });
                if (!category) throw new NotFoundError("La categoría no existe.");
                nextCategory = category;
            }
            if (!nextCategory) throw new NotFoundError("La categoría no existe.");
            if (nextCategory.type !== nextType) {
                throw new ConflictError("El tipo de la categoría no coincide con la transacción.", {
                    categoryId: ["El tipo de la categoría no coincide con la transacción."]
                });
            }

            // 5) Efectos de saldo. base = saldo actual - efecto viejo = saldo como
            //    si esta transacción no existiera. Se valida el estado nuevo sobre
            //    esa base y luego se aplica el delta neto una sola vez.
            const oldEffect = this.computeBalanceEffect({
                type: oldType,
                amount: oldAmount,
                account: oldAccount,
                relatedAccount: oldRelatedAccount
            });
            const newEffect = this.computeBalanceEffect({
                type: nextType,
                amount: nextAmount,
                account: nextAccount,
                relatedAccount: nextRelatedAccount
            });

            if (nextType === TypeTransaction.INCOME && nextAccount.type === TypeAccount.CREDIT) {
                throw new ConflictError("No se pueden hacer ingresos a cuentas de crédito.", {
                    type: ["No se pueden hacer ingresos a cuentas de crédito."]
                });
            }

            if (nextType === TypeTransaction.CREDIT_PAYMENT) {
                if (!nextRelatedAccount || nextRelatedAccount.type !== TypeAccount.CREDIT) {
                    throw new ConflictError("El pago de crédito debe ser hacia una cuenta de tipo crédito.", {
                        relatedAccountId: ["El pago de crédito debe ser hacia una cuenta de tipo crédito."]
                    });
                }

                const baseRelatedBalance = nextRelatedAccount.balance - (oldEffect.get(nextRelatedAccount.id) ?? 0);
                const withOverDraft = nextRelatedAccount.creditLimit * ((nextRelatedAccount.overdraft || 0) + 1);
                const debt = withOverDraft - baseRelatedBalance;

                if (nextAmount > debt) {
                    throw new BadRequestError("El pago excede la deuda de la tarjeta.", {
                        amount: ["Monto excede la deuda registrada"]
                    });
                }
            }

            // Ninguna cuenta puede quedar con saldo negativo tras el cambio
            for (const [accountId, delta] of newEffect) {
                const account = requireAccount(accountId);
                const base = account.balance - (oldEffect.get(accountId) ?? 0);
                if (base + delta < 0) {
                    throw new ConflictError("Saldo insuficiente en la cuenta.", {
                        accountId: ["Saldo insuficiente"],
                        amount: ["Monto no disponible en la cuenta."]
                    });
                }
            }

            // 6) Aplicar deltas netos: un solo UPDATE por cuenta afectada
            const touchedIds = new Set([...oldEffect.keys(), ...newEffect.keys()]);
            const accountsToSave: Account[] = [];
            for (const accountId of touchedIds) {
                const account = requireAccount(accountId);
                const net = (newEffect.get(accountId) ?? 0) - (oldEffect.get(accountId) ?? 0);
                if (net !== 0) {
                    account.balance += net;
                    accountsToSave.push(account);
                }
            }

            // 7) Actualizar la transacción. relatedAccount = null limpia el FK
            //    cuando el nuevo tipo no usa cuenta relacionada.
            transaction.type = nextType;
            transaction.amount = nextAmount;
            transaction.account = nextAccount;
            transaction.relatedAccount = nextRelatedAccount ?? null;
            transaction.category = nextCategory;
            if (updateData.name) transaction.name = updateData.name;
            if (updateData.description !== undefined) transaction.description = updateData.description;
            if (updateData.date) transaction.date = updateData.date;
            if (updateData.time) transaction.time = updateData.time;

            for (const account of accountsToSave) {
                await manager.save(account);
            }
            const updatedTransaction = await manager.save(transaction);

            await queryRunner.commitTransaction();
            return toTransactionResponse(updatedTransaction);
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async deleteTransaction(id: UuidSchema, userId: UuidSchema): Promise<void> {
        const queryRunner = AppDataSourceProd.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const manager = queryRunner.manager;

            await this.lockTransactionRow(manager, id, userId);

            const transaction = await manager.findOne(Transaction, {
                where: { id, user: { id: userId } },
                relations: ['account', 'relatedAccount']
            });
            if (!transaction) throw new NotFoundError("Transacción no encontrada para el usuario");

            const accountsById = await this.lockAccounts(
                manager,
                [transaction.account.id, transaction.relatedAccount?.id],
                userId
            );

            // Revertir el efecto exacto que la transacción tuvo sobre los saldos
            const effect = this.computeBalanceEffect({
                type: transaction.type,
                amount: transaction.amount,
                account: transaction.account,
                relatedAccount: transaction.relatedAccount ?? null
            });

            for (const [accountId, delta] of effect) {
                const account = accountsById.get(accountId);
                if (!account) throw new NotFoundError("Cuenta no encontrada o no pertenece al usuario");
                account.balance -= delta;
                await manager.save(account);
            }

            await manager.delete(Transaction, { id, user: { id: userId } });
            await queryRunner.commitTransaction();
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }
}