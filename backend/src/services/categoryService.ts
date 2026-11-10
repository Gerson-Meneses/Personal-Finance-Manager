import { AppDataSourceProd } from "../database/dataBaseDev";
import { Category } from "../entities/Category.entity";
import { ReccurentTransaction } from "../entities/ReccurentTransaction.entity";
import { Transaction } from "../entities/Transaction.entity";
import { User } from "../entities/User.entity";
import { BadRequestError, ConflictError, NotFoundError } from "../helpers/errors/domain.errors";
import { CategoryQuerySchema, CategorySchema, UpdateCategorySchema } from "../schemas/category.schema";
import { UuidSchema, uuidSchema } from "../schemas/uuid.schema";
import { PaginatedResult } from "../types";
import { TypeTransaction } from "../utils/Enums";
import { money } from "../utils/normalizarMoney";

export interface CategoryWithUsage extends Category {
    transactionCount: number;
    totalAmount: number;
}

export interface CategorySuggestion {
    id: string;
    name: string;
    color: string;
    icon: string | null;
    type: TypeTransaction;
}

const removeDiacritics = (str: string) =>
    str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

const STOPWORDS = new Set([
    "de", "del", "la", "el", "los", "las", "y", "en", "con",
    "por", "para", "un", "una", "unos", "unas", "al", "a", "o",
]);

const tokenize = (str: string): string[] =>
    removeDiacritics(str)
        .split(/[^a-z0-9]+/)
        .filter((token) => token.length >= 2 && !STOPWORDS.has(token));

/**
 * Similitud entre el nombre escrito y el de una transacción histórica:
 * - igualdad exacta → 1
 * - uno contiene al otro (>= 3 chars) → 0.9
 * - cobertura de tokens del query presentes en la transacción → hits / total
 */
const scoreTransactionName = (queryNorm: string, queryTokens: string[], txName: string): number => {
    const txNorm = removeDiacritics(txName);
    if (!txNorm) return 0;
    if (txNorm === queryNorm) return 1;
    if (Math.min(queryNorm.length, txNorm.length) >= 3 && (txNorm.includes(queryNorm) || queryNorm.includes(txNorm))) {
        return 0.9;
    }

    const txTokens = new Set(tokenize(txName));
    if (!txTokens.size || !queryTokens.length) return 0;

    let hits = 0;
    for (const token of queryTokens) {
        if (txTokens.has(token)) hits += 1;
    }
    if (!hits) return 0;
    return hits / queryTokens.length;
};

const MATCH_THRESHOLD = 0.5;
const HISTORY_LIMIT = 500;

export class CategoryService {

    private categoryRepo = AppDataSourceProd.getRepository(Category)
    private userRepo = AppDataSourceProd.getRepository(User)
    private transactionRepo = AppDataSourceProd.getRepository(Transaction)
    private recurrentRepo = AppDataSourceProd.getRepository(ReccurentTransaction)

    async getCategoriesByUser(userId: UuidSchema, filters: CategoryQuerySchema): Promise<PaginatedResult<CategoryWithUsage>> {
        const page = filters.page && filters.page > 0 ? filters.page : 1;
        const limit = filters.limit && filters.limit > 0 ? filters.limit : 100;
        const order = filters.order ?? 'DESC';

        const qb = this.categoryRepo
            .createQueryBuilder('t')
            .where('t.userId = :userId', { userId: userId });

        qb.orderBy('t.name', order)
            .skip((page - 1) * limit)
            .take(limit);

        const [categories, total] = await qb.getManyAndCount();

        const usageQb = this.transactionRepo
            .createQueryBuilder('tx')
            .select('tx.categoryId', 'categoryId')
            .addSelect('COUNT(tx.id)', 'transactionCount')
            .addSelect('COALESCE(SUM(tx.amount), 0)', 'totalAmount')
            .where('tx.userId = :userId', { userId })
            .andWhere('tx.categoryId IS NOT NULL')
            .groupBy('tx.categoryId');

        // Métricas del mes solicitado (YYYY-MM). Sin month = histórico completo.
        if (filters.month) {
            const [year, monthNumber] = filters.month.split('-').map(Number);
            const lastDay = new Date(year, monthNumber, 0).getDate();
            const from = `${filters.month}-01`;
            const to = `${filters.month}-${String(lastDay).padStart(2, '0')}`;
            usageQb.andWhere('tx.date >= :from AND tx.date <= :to', { from, to });
        }

        const usageRaw = await usageQb.getRawMany();

        const usageById = new Map<string, { transactionCount: string | number; totalAmount: string | number }>(
            usageRaw.map((row) => [row.categoryId, row])
        );

        const items: CategoryWithUsage[] = categories.map((category) => {
            const usage = usageById.get(category.id);
            return {
                ...category,
                transactionCount: Number(usage?.transactionCount ?? 0),
                totalAmount: money(Number(usage?.totalAmount ?? 0)),
            };
        });

        return {
            items,
            total,
            page,
            limit,
        };
    }

    async getCategoryById(categoryId: UuidSchema, userId: UuidSchema): Promise<Category> {
        const category = await this.categoryRepo.findOne({ where: { id: categoryId, user: { id: userId as any } }, relations: ["transactions"] })
        if (!category) throw new NotFoundError("Categoria no encontrada o no pertenece al usuario.")
        return category
    }

    /**
     * Sugiere la categoría más usada en transacciones históricas
     * cuyo nombre se parezca al consultado.
     */
    async suggestCategory(userId: UuidSchema, name: string, type: TypeTransaction): Promise<{ suggestion: CategorySuggestion | null }> {
        const queryNorm = removeDiacritics(name);
        const queryTokens = tokenize(name);
        if (!queryTokens.length) return { suggestion: null };

        const history: { name: string; categoryId: string }[] = await this.transactionRepo
            .createQueryBuilder("tx")
            .select("tx.name", "name")
            .addSelect("tx.categoryId", "categoryId")
            .where("tx.userId = :userId", { userId })
            .andWhere("tx.type = :type", { type })
            .andWhere("tx.categoryId IS NOT NULL")
            .orderBy("tx.date", "DESC")
            .limit(HISTORY_LIMIT)
            .getRawMany();

        const scores = new Map<string, number>();
        for (const row of history) {
            const score = scoreTransactionName(queryNorm, queryTokens, row.name);
            if (score >= MATCH_THRESHOLD) {
                scores.set(row.categoryId, (scores.get(row.categoryId) ?? 0) + score);
            }
        }

        if (!scores.size) return { suggestion: null };

        const [bestCategoryId] = [...scores.entries()].sort((a, b) => b[1] - a[1])[0];
        const category = await this.categoryRepo.findOne({
            where: { id: bestCategoryId, user: { id: userId as any } },
        });
        if (!category) return { suggestion: null };

        return {
            suggestion: {
                id: category.id,
                name: category.name,
                color: category.color,
                icon: category.icon ?? null,
                type: category.type,
            },
        };
    }

    async createCategory(category: CategorySchema, userId: string): Promise<Category> {
        const user = await this.userRepo.findOneBy({ id: userId })
        if (!user) throw new BadRequestError("User not found")
        const categoryExist = await this.categoryRepo.findOneBy({ name: category.name, user: { id: userId }, type: category.type })
        if (categoryExist) throw new ConflictError("Usuario ya tiene categoria con este nombre y tipo", { name: "Ya existe una categoría con este nombre y tipo" })
        let nCategory = this.categoryRepo.create({
            color: category.color,
            icon: category.icon ?? "Tag",
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
            if (categoryExist && categoryExist.id !== categoryId) throw new ConflictError("Usuario ya tiene categoria con este nombre y tipo", { name: "Ya existe una categoría con este nombre y tipo" })
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

        const [transactionCount, recurrentCount] = await Promise.all([
            this.transactionRepo.createQueryBuilder('tx')
                .where('tx.categoryId = :categoryId', { categoryId })
                .getCount(),
            this.recurrentRepo.createQueryBuilder('rt')
                .where('rt.categoryId = :categoryId', { categoryId })
                .getCount(),
        ])

        if (transactionCount > 0 || recurrentCount > 0) {
            throw new BadRequestError("No se puede eliminar una categoria que tiene transacciones asociadas")
        }

        await this.categoryRepo.remove(categoryFound)
        return categoryFound
    }
}