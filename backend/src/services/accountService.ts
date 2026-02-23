import { AppDataSourceProd } from "../database/dataBaseDev";
import { Account } from "../entities/Account.entity";
import { User } from "../entities/User.entity";
import { BadRequestError, ConflictError, NotFoundError } from "../helpers/errors/domain.errors";
import { AccountSchema, UpdateAccountSchema } from "../schemas/account.schema";
import { TypeAccount } from "../utils/Enums";

export class AccountService {
    private accountRepo = AppDataSourceProd.getRepository(Account);
    private userRepo = AppDataSourceProd.getRepository(User);

    async getAllAccountsByUser(userId: string) {
        let accounts: Account[] = await this.accountRepo.find({ where: { user: { id: userId } } })
        return accounts
    }

    async createAccount(userId: string, account: AccountSchema) {
        let newAccount: {}

        const { name, type, balance } = account

        const user: User | null = await this.userRepo.findOneBy({ id: userId });
        if (!user) throw new NotFoundError("Usuario no encontrado para asignar la cuenta.")

        if (name === "EFECTIVO") throw new ConflictError("El nombre 'EFECTIVO' está reservado y no puede ser utilizado para una cuenta.")

        let accountExist = await this.accountRepo.findOne({ where: { name, user: { id: userId }, type } })
        if (accountExist) throw new ConflictError("El usuario ya tiene una cuenta con este nombre y tipo.")


        if (type === TypeAccount.CREDIT) {
            const { creditLimit, billingCloseDay, paymentDueDay, overdraft } = account
            if (!creditLimit || !billingCloseDay || !paymentDueDay) {
                throw new BadRequestError("Required creditLimit,  billingCLoseDay, paymentDueDay for Type Account Credit")
            }
            newAccount = this.accountRepo.create({
                name,
                type,
                balance: balance ? balance : creditLimit * ((overdraft || 0) + 1),
                creditLimit,
                billingCloseDay,
                paymentDueDay,
                overdraft,
                user
            })

            await this.accountRepo.save(newAccount)
        } else {
            newAccount = this.accountRepo.create({
                name,
                type,
                balance: balance ? balance : 0,
                user
            })
            await this.accountRepo.save(newAccount)
        }
        return newAccount
    }

    async getAccountById(accountId: string, userId: string): Promise<Account> {
        const account = await this.accountRepo.findOne({ where: { id: accountId, user: { id: userId } } });
        if (!account) throw new NotFoundError("Cuenta no encontrada o no pertenece al usuario.")
        return account
    }

    async updateAccount(accountId: string, userId: string, updateData: UpdateAccountSchema) {
        const account = await this.accountRepo.findOne({ where: { id: accountId, user: { id: userId } } });
        if (!account) throw new NotFoundError("Cuenta no encontrada o no pertenece al usuario.")

        if (account.type === TypeAccount.CASH) throw new BadRequestError("No se puede actualizar la cuenta de EFECTIVO.")
        if (account.name === updateData.name) throw new BadRequestError("La cuenta no puede tener el mismo nombre.")

        const isNameAvailable = await this.accountRepo.findOne({ where: { name: updateData.name, user: { id: userId }, type: account.type } })
        if (isNameAvailable && isNameAvailable.id !== accountId) throw new ConflictError("El usuario ya tiene una cuenta con este nombre y tipo.")

        if (updateData.name && updateData.name === "EFECTIVO") throw new ConflictError("El nombre 'EFECTIVO' está reservado y no puede ser utilizado para una cuenta.")

        const updatedAccount = Object.assign(account, updateData);
        return await this.accountRepo.save(updatedAccount);
    }

    async deleteAccount(accountId: string, userId: string): Promise<Account> {
        const account = await this.accountRepo.findOne({ where: { id: accountId, user: { id: userId } }, relations: ["transactions"] });
        if (!account) throw new NotFoundError("Cuenta no encontrada o no pertenece al usuario.")
        if (account.type === TypeAccount.CASH) throw new BadRequestError("No se puede eliminar la cuenta de EFECTIVO.")
        if (account.transactions && account.transactions.length > 0) throw new BadRequestError("No se puede eliminar una cuenta que tiene transacciones asociadas.")
        if (account.balance && account.balance > 0) throw new BadRequestError("No se puede eliminar una cuenta que tiene saldo disponible.")

        await this.accountRepo.remove(account)
        return account
    }
}