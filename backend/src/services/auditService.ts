import { EntityManager } from "typeorm";
import { AppDataSourceProd } from "../database/dataBaseDev";
import { AuditLog } from "../entities/AuditLog.entity";
import { UuidSchema } from "../schemas/uuid.schema";

export class AuditService {
    private repo = AppDataSourceProd.getRepository(AuditLog);

    async log(
        userId: UuidSchema,
        entityType: string,
        entityId: string,
        action: string,
        options: {
            before?: Record<string, unknown> | null;
            after?: Record<string, unknown> | null;
            reason?: string | null;
        } = {},
        manager?: EntityManager
    ): Promise<void> {
        const repo = manager ? manager.getRepository(AuditLog) : this.repo;
        await repo.save(
            repo.create({
                userId,
                entityType,
                entityId,
                action,
                before: options.before ?? null,
                after: options.after ?? null,
                reason: options.reason ?? null,
            })
        );
    }

    async list(userId: UuidSchema, entityType: string, entityId: string): Promise<AuditLog[]> {
        return this.repo.find({
            where: { userId, entityType, entityId },
            order: { createdAt: "DESC" },
            take: 100,
        });
    }
}
