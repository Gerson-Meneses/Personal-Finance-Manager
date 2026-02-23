import { AppDataSourceProd } from "../database/dataBaseDev";
import { User } from "../entities/User.entity";
import { NotFoundError } from "../helpers/errors/domain.errors";

export class UserService {
    private userRepo = AppDataSourceProd.getRepository(User);


    getUserById = async (userId: string): Promise<User> => {
        const user: User | null = await this.userRepo.findOne({ where: { id: userId }, relations: ["accounts", "categories"] });
        if (!user) throw new NotFoundError("User not found");
        return user;
    }
}