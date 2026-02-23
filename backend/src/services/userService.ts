import { AppDataSource } from "../database/dataSource";
import { User } from "../entities/User.entity";
import { NotFoundError } from "../helpers/errors/domain.errors";

export class UserService {
    private userRepo = AppDataSource.getRepository(User);


    getUserById = async (userId: string): Promise<User> => {
        const user: User | null = await this.userRepo.findOne({ where: { id: userId }, relations: ["accounts", "categories"] });
        if (!user) throw new NotFoundError("User not found");
        return user;
    }
}