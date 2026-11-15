import { EntityManager } from "typeorm";
import { AppDataSourceProd } from "../database/dataBaseDev";
import { Contact } from "../entities/Contact.entity";
import { Loan } from "../entities/Loan.entity";
import { LoanPlan } from "../entities/LoanPlan.entity";
import { DebtInstallment } from "../entities/DebtInstallment.entity";
import { RecurringPayment } from "../entities/RecurringPayment.entity";
import { ConflictError, NotFoundError } from "../helpers/errors/domain.errors";
import { UuidSchema } from "../schemas/uuid.schema";

export const normalizeContactName = (name: string) =>
    name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .replace(/\s+/g, " ")
        .toUpperCase();

export class ContactService {
    private contactRepo = AppDataSourceProd.getRepository(Contact);

    async findOrCreate(
        userId: UuidSchema,
        name: string,
        manager?: EntityManager
    ): Promise<Contact> {
        const repo = manager ? manager.getRepository(Contact) : this.contactRepo;
        const normalizedName = normalizeContactName(name);
        const existing = await repo.findOne({
            where: { userId, normalizedName },
            order: { createdAt: "ASC" },
        });
        if (existing) return existing;

        const contact = repo.create({
            userId,
            name: name.trim().replace(/\s+/g, " "),
            normalizedName,
        });
        return repo.save(contact);
    }

    async create(userId: UuidSchema, name: string, notes?: string): Promise<Contact> {
        return this.contactRepo.save(
            this.contactRepo.create({
                userId,
                name: name.trim().replace(/\s+/g, " "),
                normalizedName: normalizeContactName(name),
                notes: notes ?? null,
            })
        );
    }

    async list(userId: UuidSchema): Promise<Contact[]> {
        return this.contactRepo.find({
            where: { userId, archived: false },
            order: { name: "ASC" },
        });
    }

    async update(
        userId: UuidSchema,
        contactId: UuidSchema,
        data: { name?: string; notes?: string | null; archived?: boolean }
    ): Promise<Contact> {
        const contact = await this.contactRepo.findOne({ where: { id: contactId, userId } });
        if (!contact) throw new NotFoundError("Contacto no encontrado");

        let renamed = false;
        if (data.name !== undefined) {
            contact.name = data.name.trim().replace(/\s+/g, " ");
            contact.normalizedName = normalizeContactName(contact.name);
            renamed = true;
        }
        if (data.notes !== undefined) contact.notes = data.notes;
        if (data.archived !== undefined) contact.archived = data.archived;

        const saved = await this.contactRepo.save(contact);
        if (renamed) {
            await this.contactRepo.manager.update(
                Loan,
                { contactId: contactId, userId },
                { lender: saved.name }
            );
            await this.contactRepo.manager.update(
                RecurringPayment,
                { loanContactId: contactId, userId },
                { loanCounterparty: saved.name }
            );
        }
        return saved;
    }

    async merge(
        userId: UuidSchema,
        sourceContactId: UuidSchema,
        targetContactId: UuidSchema
    ): Promise<Contact> {
        if (sourceContactId === targetContactId) {
            throw new ConflictError("No puedes fusionar un contacto consigo mismo");
        }

        const queryRunner = AppDataSourceProd.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const manager = queryRunner.manager;
            const [source, target] = await Promise.all([
                manager.findOne(Contact, { where: { id: sourceContactId, userId } }),
                manager.findOne(Contact, { where: { id: targetContactId, userId } }),
            ]);

            if (!source || !target) throw new NotFoundError("Contacto no encontrado");

            await manager.update(
                Loan,
                { contactId: sourceContactId },
                { contactId: targetContactId, lender: target.name }
            );
            await manager.update(LoanPlan, { contactId: sourceContactId }, { contactId: targetContactId });
            await manager.update(
                DebtInstallment,
                { contactId: sourceContactId },
                { contactId: targetContactId }
            );
            await manager.update(
                RecurringPayment,
                { loanContactId: sourceContactId, userId },
                { loanContactId: targetContactId, loanCounterparty: target.name }
            );
            await manager.remove(Contact, source);

            await queryRunner.commitTransaction();
            return target;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }
}
