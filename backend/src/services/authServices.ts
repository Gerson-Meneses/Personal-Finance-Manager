import { ConflictError, NotFoundError } from "../helpers/errors/domain.errors";
import { UserWithCredentials } from "../schemas/user.schema";
import { User } from "../entities/User.entity";
import { AppDataSource } from "../database/dataSource";
import { Credential } from "../entities/Credential.entity";
import { sign } from 'hono/jwt'
import { CredentialSchema } from "../schemas/credential.schema";
import { JWT_SECRET } from "../../.env";
import { Account } from "../entities/Account.entity";
import { TypeAccount } from "../utils/Enums";
import { categoriesBase } from "../utils/categoriesBase";

export class AuthService {
  private userRepo = AppDataSource.getRepository(User);
  private credentialRepo = AppDataSource.getRepository(Credential);
  private accountRepo = AppDataSource.getRepository(Account);


  async createUser(userData: UserWithCredentials) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const existingUser = await this.credentialRepo.findOneBy({ email: userData.email });
      if (existingUser) {
        throw new ConflictError('Email already in use');
      }

      const phoneInUse = await this.userRepo.findOneBy({ phone: userData.phone });
      if (phoneInUse) {
        throw new ConflictError('Phone number already in use');
      }

      const credential: Credential = this.credentialRepo.create({ email: userData.email, password: await Bun.password.hash(userData.password) });
      await queryRunner.manager.save(credential);

      const user: User = this.userRepo.create({
        ...userData,
        credential: credential
      });
      await queryRunner.manager.save(user);

      credential.user = user;
      await queryRunner.manager.save(credential);

      const accountCash: Account = this.accountRepo.create({
        name: "EFECTIVO",
        type: TypeAccount.CASH,
        balance: 0,
        user: user
      })
      await queryRunner.manager.save(accountCash);

      categoriesBase.forEach(async (category) => {
        const newCategory = queryRunner.manager.create('Category', {
          ...category,
          isBase: true,
          user: user
        });
        await queryRunner.manager.save(newCategory);
      });

      await queryRunner.commitTransaction();

    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      const data = await this.logingUser({ email: userData.email, password: userData.password });
      await queryRunner.release();
      return data;
    }
  }

  async logingUser(credentials: CredentialSchema) {
    const credential: Credential | null = await this.credentialRepo.findOne({
      where: { email: credentials.email },
      select: ['id', 'email', 'password'],
      relations: ['user']
    });
    if (!credential) {
      throw new NotFoundError('Invalid credentials');
    }
    const isPasswordValid = await Bun.password.verify(credentials.password, credential.password);
    if (!isPasswordValid) {
      throw new NotFoundError('Invalid credentials');
    }
    const payload = {
      sub: credential.user.id,
      email: credential.email,
      role: credential.user.isAdmin ? 'admin' : 'user',
      exp: Math.floor(Date.now() / 1000) + 60 * 15000 // 15 min
    }

    const token = await sign(payload, JWT_SECRET)

    return { payload, token };
  }

  async findAll() {
    return this.userRepo.find();
  }
}
