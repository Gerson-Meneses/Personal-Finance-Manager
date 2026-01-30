import { AppDataSource } from "../database/dataSource";
import { Account } from "../entities/Account.entity";
import { User } from "../entities/User.entity";
import { BadRequestError, ConflictError, NotFoundError } from "../helpers/errors/domain.errors";
import { AccountSchema } from "../schemas/account.schema";
import { TypeAccount } from "../utils/Enums";

export class AccountService {
    private accountRepo = AppDataSource.getRepository(Account);
    private userRepo = AppDataSource.getRepository(User);

    async getAllAccountsByUser(userId: string) {
        console.log(userId)
        let accounts: Account[] = await this.accountRepo.find({ where: { user: { id: userId } } })
        return accounts
    }

    async createAccount(userId: string, account: AccountSchema) {
        console.log("", userId);
        let newAccount: {}

        const { name, type, balance } = account

        const user: User | null = await this.userRepo.findOneBy({ id: userId });
        console.log("", user);
        if (!user) throw new NotFoundError("User not found")
        const accountExist = await this.accountRepo.findOne({ where: { name, user: { id: userId } } })
        if (accountExist) throw new ConflictError("El usuario ya tiene una cuenta con este nombre.")

        if (type === TypeAccount.CREDIT) {
            const { creditLimit, billingCloseDay, paymentDueDay } = account
            if (!creditLimit || !billingCloseDay || !paymentDueDay) {
                throw new BadRequestError("Required creditLimit,  billingCLoseDay, paymentDueDay for Type Account Credit")
            }
            newAccount = this.accountRepo.create({
                name,
                type,
                balance: balance ? balance : creditLimit,
                creditLimit,
                billingCloseDay,
                paymentDueDay,
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

}