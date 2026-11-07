import { AppDataSourceProd } from "../database/dataBaseDev";
import { User } from "../entities/User.entity";
import { ForbiddenError, NotFoundError } from "../helpers/errors/domain.errors";
import { UuidSchema } from "../schemas/uuid.schema";
import { Repository } from "typeorm";

export const assertNotLastAdmin = async (userRepo: Repository<User>, user: User): Promise<void> => {
    if (!user.isAdmin) return;

    const activeAdmins = await userRepo.count({ where: { isAdmin: true } });
    if (activeAdmins <= 1) {
        throw new ForbiddenError("No se puede eliminar el último administrador");
    }
}

export class UserService {
    private userRepo = AppDataSourceProd.getRepository(User);


    getUserById = async (userId: string): Promise<User> => {
        const user: User | null = await this.userRepo.findOne({ where: { id: userId }, relations: ["accounts", "categories", "credential"] });
        if (!user) throw new NotFoundError("User not found");
        return user;
    }

    getAllUsers = async (): Promise<User[]> => {
        return await this.userRepo.find({relations:["credential"]})
    }

    deleteUser = async (id: UuidSchema): Promise<void> => {
        const user = await this.userRepo.findOne({ where: { id } });
        if (!user) throw new NotFoundError("User not found");

        await assertNotLastAdmin(this.userRepo, user);

        await this.userRepo.softDelete({ id });
    }

}
