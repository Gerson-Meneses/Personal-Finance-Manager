import { AppDataSourceProd } from "../database/dataBaseDev";
import { Account } from "../entities/Account.entity";
import { User } from "../entities/User.entity";
import { BadRequestError, ConflictError, NotFoundError } from "../helpers/errors/domain.errors";
import { AccountSchema, UpdateAccountSchema } from "../schemas/account.schema";
import { PaginationQuerySchema } from "../schemas/queryPagination.schema";
import { UuidSchema } from "../schemas/uuid.schema";
import { PaginatedResult } from "../types";
import { TypeAccount } from "../utils/Enums";

export class AccountService {
    private accountRepo = AppDataSourceProd.getRepository(Account);
    private userRepo = AppDataSourceProd.getRepository(User);

    async getAllAccountsByUser(userId: UuidSchema, filters: PaginationQuerySchema): Promise<PaginatedResult<Account>> {

        const page = filters.page && filters.page > 0 ? filters.page : 1;
        const limit = filters.limit && filters.limit > 0 ? filters.limit : 20;
        const order = filters.order ?? 'DESC';

        const qb = this.accountRepo
            .createQueryBuilder('t')
            .where('t.userId = :userId', { userId: userId });

        qb.orderBy('t.name', order)
            .skip((page - 1) * limit)
            .take(limit);

        let [accounts, total] = await qb.getManyAndCount();

        accounts = accounts.map(account => { account.balance = account.balance / 100; return account })

        return {
            items: accounts,
            total,
            page,
            limit,
        };
    }

    async createAccount(userId: string, account: AccountSchema): Promise<Account> {
        let newAccount: Account = {} as Account

        const { name, type, color, icon } = account
        let { balance } = account

        balance = balance ? balance * 100 : 0

        const user: User | null = await this.userRepo.findOneBy({ id: userId });
        if (!user) throw new NotFoundError("Usuario no encontrado para asignar la cuenta.")

        if (name === "EFECTIVO") throw new ConflictError("El nombre 'EFECTIVO' está reservado y no puede ser utilizado para una cuenta.")

        let accountExist = await this.accountRepo.findOne({ where: { name, user: { id: userId }, type } })
        if (accountExist) throw new ConflictError("El usuario ya tiene una cuenta con este nombre y tipo.")


        if (type === TypeAccount.CREDIT) {
            const { billingCloseDay, paymentDueDay, overdraft } = account
            let { creditLimit } = account
            creditLimit
            if (!creditLimit || !billingCloseDay || !paymentDueDay) {
                throw new BadRequestError("Required creditLimit,  billingCLoseDay, paymentDueDay for Type Account Credit")
            }
            newAccount = this.accountRepo.create({
                name,
                type,
                icon,
                color,
                balance: Math.floor(creditLimit * ((overdraft ? overdraft / 100 : 0) + 1)),
                creditLimit,
                billingCloseDay,
                paymentDueDay,
                overdraft,
                user
            })

            await this.accountRepo.save(newAccount)

            newAccount.balance = newAccount.creditLimit / 100
        } else {
            newAccount = this.accountRepo.create({
                name,
                type,
                balance: balance ? balance : 0,
                user,
                color,
                icon
            })
            await this.accountRepo.save(newAccount)
        }
        return { ...newAccount, balance: newAccount.balance / 100 }
    }

    async getAccountById(accountId: string, userId: string): Promise<Account> {
        const account = await this.accountRepo.findOne({ where: { id: accountId, user: { id: userId } } });
        if (!account) throw new NotFoundError("Cuenta no encontrada o no pertenece al usuario.")
        if (account.type === TypeAccount.CREDIT) {
            account.creditLimit = account.creditLimit / 100
        }
        return { ...account, balance: account.balance / 100 }
    }

    async updateAccount(accountId: string, userId: string, updateData: UpdateAccountSchema): Promise<Account> {
        const account = await this.accountRepo.findOne({ where: { id: accountId, user: { id: userId } } });
        if (!account) throw new NotFoundError("Cuenta no encontrada o no pertenece al usuario.")

        if (account.type === TypeAccount.CASH) throw new BadRequestError("No se puede actualizar la cuenta de EFECTIVO.")
        if (account.name === updateData.name) throw new BadRequestError("La cuenta no puede tener el mismo nombre.")

        const isNameAvailable = await this.accountRepo.findOne({ where: { name: updateData.name, user: { id: userId }, type: account.type } })
        if (isNameAvailable && isNameAvailable.id !== accountId) throw new ConflictError("El usuario ya tiene una cuenta con este nombre y tipo.")

        if (updateData.name && updateData.name === "EFECTIVO") throw new ConflictError("El nombre 'EFECTIVO' está reservado y no puede ser utilizado para una cuenta.")

        const updatedAccount = Object.assign(account, updateData);
        const savedAccount = await this.accountRepo.save(updatedAccount);

        return { ...savedAccount, balance: savedAccount.balance / 100 }
    }

    async deleteAccount(accountId: string, userId: string): Promise<void> {
        const account = await this.accountRepo.findOne({ where: { id: accountId, user: { id: userId } }, relations: ["transactions"] });
        if (!account) throw new NotFoundError("Cuenta no encontrada o no pertenece al usuario.")
        if (account.type === TypeAccount.CASH) throw new BadRequestError("No se puede eliminar la cuenta de EFECTIVO.")
        if (account.transactions && account.transactions.length > 0) throw new BadRequestError("No se puede eliminar una cuenta que tiene transacciones asociadas.")

        await this.accountRepo.remove(account)
        return 
    }
}