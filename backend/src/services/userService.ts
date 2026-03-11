import { AppDataSourceProd } from "../database/dataBaseDev";
import { User } from "../entities/User.entity";
import { ConflictError, NotFoundError } from "../helpers/errors/domain.errors";
import { UuidSchema } from "../schemas/uuid.schema";

export class UserService {
    private userRepo = AppDataSourceProd.getRepository(User);


    getUserById = async (userId: string): Promise<User> => {
        const user: User | null = await this.userRepo.findOne({ where: { id: userId }, relations: ["accounts", "categories"] });
        if (!user) throw new NotFoundError("User not found");
        return user;
    }

    getAllUsers = async (): Promise<User[]> => {
        return await this.userRepo.find({relations:["credential"]})
    }

    deleteUser = async (id: UuidSchema): Promise<void> =>{
       throw new NotFoundError("Not Implemented yet")
    }

}