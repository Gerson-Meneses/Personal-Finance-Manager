import { ConflictError, NotFoundError } from "../helpers/errors/domain.errors";
import { UserWithCredentials } from "../schemas/user.schema";
import { User } from "../entities/User.entity";
import { AppDataSource } from "../database/dataSource";
import { Credential } from "../entities/Credential.entity";
import { sign } from 'hono/jwt'
import { CredentialSchema } from "../schemas/credential.schema";
import { JWT_SECRET } from "../../.env";

export class UserService {
  private userRepo = AppDataSource.getRepository(User);
  private credentialRepo = AppDataSource.getRepository(Credential);

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
      credential.user = user;
      await queryRunner.manager.save(credential);
      await queryRunner.manager.save(user);
      await queryRunner.commitTransaction();
      return user;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
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
      exp: Math.floor(Date.now() / 1000) + 60 * 15 // 15 min
    }

    const token = await sign(payload, JWT_SECRET)
    console.log({ token, payload });

    return { payload, token };
  }

  async findAll() {
    return this.userRepo.find();
  }
}
