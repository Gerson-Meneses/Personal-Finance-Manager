import { AppDataSourceProd } from "../database/dataBaseDev";
import { Tag } from "../entities/Tag.entity";
import { Transaction } from "../entities/Transaction.entity";
import { TransactionSplit } from "../entities/TransactionSplit.entity";
import { User } from "../entities/User.entity";
import { ConflictError, NotFoundError } from "../helpers/errors/domain.errors";
import { TagQuerySchema, TagSchema, UpdateTagSchema } from "../schemas/tag.schema";
import { UuidSchema } from "../schemas/uuid.schema";
import { PaginatedResult } from "../types";
import { toTagResponse } from "../mappers/TagMapper";
import { TagResponse } from "../ResponseInterfaces/TagResponse";

export class TagService {
    private tagRepo = AppDataSourceProd.getRepository(Tag);
    private userRepo = AppDataSourceProd.getRepository(User);
    private transactionRepo = AppDataSourceProd.getRepository(Transaction);
    private splitRepo = AppDataSourceProd.getRepository(TransactionSplit);

    async getTagsByUser(
        userId: UuidSchema,
        filters: TagQuerySchema
    ): Promise<PaginatedResult<TagResponse>> {
        const page = filters.page && filters.page > 0 ? filters.page : 1;
        const limit = filters.limit && filters.limit > 0 ? filters.limit : 100;

        const qb = this.tagRepo
            .createQueryBuilder("tag")
            .where("tag.userId = :userId", { userId })
            .orderBy("tag.name", filters.order ?? "ASC")
            .skip((page - 1) * limit)
            .take(limit);

        if (filters.search) {
            qb.andWhere("tag.name ILIKE :search", { search: `%${filters.search}%` });
        }

        const [tags, total] = await qb.getManyAndCount();

        const usageRows: { tagId: string; count: string }[] = await this.tagRepo.manager.query(
            `
            SELECT "tagId", COUNT(*)::text AS count
            FROM (
                SELECT "tagId" FROM "transaction_tags"
                UNION ALL
                SELECT "tagId" FROM "transaction_split_tags"
            ) AS usage
            GROUP BY "tagId"
            `
        );
        const usageById = new Map(usageRows.map((row) => [row.tagId, Number(row.count)]));

        return {
            items: tags.map((tag) => toTagResponse(tag, { usageCount: usageById.get(tag.id) ?? 0 })),
            total,
            page,
            limit,
        };
    }

    async getTagById(tagId: UuidSchema, userId: UuidSchema): Promise<TagResponse> {
        const tag = await this.tagRepo.findOne({
            where: { id: tagId, user: { id: userId } },
        });
        if (!tag) throw new NotFoundError("Etiqueta no encontrada o no pertenece al usuario.");

        const [txCount, splitCount] = await Promise.all([
            this.transactionRepo
                .createQueryBuilder("tx")
                .innerJoin("tx.tags", "tag", "tag.id = :tagId", { tagId })
                .getCount(),
            this.splitRepo
                .createQueryBuilder("split")
                .innerJoin("split.tags", "tag", "tag.id = :tagId", { tagId })
                .getCount(),
        ]);

        return toTagResponse(tag, { usageCount: txCount + splitCount });
    }

    async createTag(tag: TagSchema, userId: UuidSchema): Promise<TagResponse> {
        const user = await this.userRepo.findOneBy({ id: userId });
        if (!user) throw new NotFoundError("Usuario no encontrado");

        const existing = await this.findByName(userId, tag.name);
        if (existing) {
            throw new ConflictError("Ya tienes una etiqueta con este nombre", {
                name: ["Ya existe una etiqueta con este nombre"],
            });
        }

        const newTag = this.tagRepo.create({
            name: tag.name,
            color: tag.color ?? "#64748b",
            user,
        });

        const saved = await this.tagRepo.save(newTag);
        return toTagResponse(saved, { usageCount: 0 });
    }

    async updateTag(
        userId: UuidSchema,
        tagId: UuidSchema,
        update: UpdateTagSchema
    ): Promise<TagResponse> {
        const tag = await this.tagRepo.findOne({
            where: { id: tagId, user: { id: userId } },
        });
        if (!tag) throw new NotFoundError("Etiqueta no encontrada o no pertenece al usuario.");

        if (update.name) {
            const existing = await this.findByName(userId, update.name);
            if (existing && existing.id !== tagId) {
                throw new ConflictError("Ya tienes una etiqueta con este nombre", {
                    name: ["Ya existe una etiqueta con este nombre"],
                });
            }
        }

        if (update.name !== undefined) tag.name = update.name;
        if (update.color !== undefined) tag.color = update.color;

        const saved = await this.tagRepo.save(tag);
        return toTagResponse(saved);
    }

    async deleteTag(userId: UuidSchema, tagId: UuidSchema): Promise<void> {
        const tag = await this.tagRepo.findOne({
            where: { id: tagId, user: { id: userId } },
        });
        if (!tag) throw new NotFoundError("Etiqueta no encontrada o no pertenece al usuario.");

        await this.tagRepo.remove(tag);
    }

    private findByName(userId: UuidSchema, name: string) {
        return this.tagRepo
            .createQueryBuilder("tag")
            .where("tag.userId = :userId", { userId })
            .andWhere("LOWER(tag.name) = LOWER(:name)", { name })
            .getOne();
    }
}
