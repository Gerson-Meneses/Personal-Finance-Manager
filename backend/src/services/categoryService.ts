import { AppDataSource } from "../database/dataSource";
import { Category } from "../entities/Category.entity";
import { User } from "../entities/User.entity";
import { BadRequestError, ConflictError, NotFoundError } from "../helpers/errors/domain.errors";
import { CategorySchema, UpdateCategorySchema } from "../schemas/category.schema";
import { UuidSchema, uuidSchema } from "../schemas/uuid.schema";

export class CategoryService {

    private categoryRepo = AppDataSource.getRepository(Category)
    private userRepo = AppDataSource.getRepository(User)

    async getCategoriesByUser(userId: string): Promise<Category[]> {
        return await this.categoryRepo.find({ where: { user: { id: userId } } })
    }

    async getCategoryById(categoryId: UuidSchema, userId: UuidSchema): Promise<Category> {
        const category = await this.categoryRepo.findOne({ where: { id: categoryId, user: { id: userId } }, relations: ["transactions"] })
        if (!category) throw new NotFoundError("Categoria no encontrada o no pertenece al usuario.")
        return category
    }

    async createCategory(category: CategorySchema, userId: string): Promise<Category> {
        const user = await this.userRepo.findOneBy({ id: userId })
        if (!user) throw new BadRequestError("User not found")
        const categoryExist = await this.categoryRepo.findOneBy({ name: category.name, user: { id: userId }, type: category.type })
        if (categoryExist) throw new ConflictError("Usuario ya tiene categoria con este nombre y tipo")
        let nCategory = this.categoryRepo.create({
            name: category.name,
            type: category.type,
            user: user,
        })
        const newCategory = await this.categoryRepo.save(nCategory)
        return newCategory
    }

    async updateCategory(userId: UuidSchema, categoryId: UuidSchema, categoryUpdate: UpdateCategorySchema): Promise<Category> {
        let categoryFound = await this.categoryRepo.findOne({ where: { id: categoryId, user: { id: userId } } })
        if (!categoryFound) throw new NotFoundError("Categoria no encontrada o no pertenece al usuario.")

        if (categoryUpdate.name) {
            const categoryExist = await this.categoryRepo.findOneBy({ name: categoryUpdate.name, user: { id: userId }, type: categoryFound.type })
            if (categoryExist && categoryExist.id !== categoryId) throw new ConflictError("Usuario ya tiene categoria con este nombre y tipo")
        }

        if (categoryFound.isBase) {
            if (categoryUpdate.name) {
                throw new BadRequestError("No se puede cambiar el nombre de una categoria base")
            } else {
                Object.assign(categoryFound, categoryUpdate)
            }
        } else {
            Object.assign(categoryFound, categoryUpdate)
        }

        await this.categoryRepo.save(categoryFound)

        return categoryFound

    }

     async deleteCategory(userId: UuidSchema, categoryId: UuidSchema): Promise<Category> {
        const categoryFound = await this.categoryRepo.findOne({ where: { id: categoryId, user: { id: userId } } })
        if (!categoryFound) throw new NotFoundError("Categoria no encontrada o no pertenece al usuario.")
        if (categoryFound.isBase) throw new BadRequestError("No se puede eliminar una categoria base")
        if(categoryFound.transactions && categoryFound.transactions.length > 0) throw new BadRequestError("No se puede eliminar una categoria que tiene transacciones asociadas")
        await this.categoryRepo.remove(categoryFound)
        return categoryFound
    }
}