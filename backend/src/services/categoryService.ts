import { AppDataSource } from "../database/dataSource";
import { Category } from "../entities/Category.entity";
import { User } from "../entities/User.entity";
import { BadRequestError, ConflictError } from "../helpers/errors/domain.errors";
import { CategorySchema } from "../schemas/category.schema";

export class CategoryService {

    private categoryRepo = AppDataSource.getRepository(Category)
    private userRepo = AppDataSource.getRepository(User)

    async getAccountsByUser(userId: string): Promise<Category[]> {
        return await this.categoryRepo.find({ where: { user: { id: userId } } })
    }

    async createAccount(category: CategorySchema, userId: string): Promise<Category> {
        const user = await this.userRepo.findOneBy({ id: userId })
        if (!user) throw new BadRequestError("User not found")
        const categoryExist = await this.categoryRepo.findOneBy({ name: category.name, user: { id: userId } })
        if (categoryExist) throw new ConflictError("Usuario ya tiene categoria con este nombre")
        let nCategory = this.categoryRepo.create({
            name: category.name,
            type: category.type,
            user: user,
        })
        const newCategory = await this.categoryRepo.save(nCategory)
        return newCategory
    }
}