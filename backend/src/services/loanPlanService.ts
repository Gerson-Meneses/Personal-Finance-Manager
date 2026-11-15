import dayjs, { Dayjs } from "dayjs";
import { Between, In, IsNull, LessThan } from "typeorm";
import { AppDataSourceProd } from "../database/dataBaseDev";
import { Contact } from "../entities/Contact.entity";
import { DebtInstallment } from "../entities/DebtInstallment.entity";
import { Loan } from "../entities/Loan.entity";
import { LoanPlan } from "../entities/LoanPlan.entity";
import { LoanMovement } from "../entities/LoanMovement.entity";
import { PaymentNotification } from "../entities/PaymentNotification.entity";
import { ConflictError, NotFoundError } from "../helpers/errors/domain.errors";
import { calculateLoanPaymentStatus } from "../mappers/LoansMapper";
import { UuidSchema } from "../schemas/uuid.schema";
import type { CreateLoanPlanOutput } from "../schemas/loanPlan.schema";
import { DebtInstallmentStatus, LoanPlanStatus, RecurrenceFrequency } from "../utils/Enums";
import { AuditService } from "./auditService";

function buildDates(
    startDate: string,
    frequency: RecurrenceFrequency,
    intervalCount: number,
    count: number
): string[] {
    if (count <= 0) return [];
    if (frequency === RecurrenceFrequency.ONCE) return [startDate];

    const dates: string[] = [];
    const interval = Math.max(1, intervalCount);
    let cursor: Dayjs = dayjs(startDate);

    for (let index = 0; index < count; index += 1) {
        dates.push(cursor.format("YYYY-MM-DD"));
        if (frequency === RecurrenceFrequency.WEEKLY) cursor = cursor.add(7 * interval, "day");
        else if (frequency === RecurrenceFrequency.BIWEEKLY) cursor = cursor.add(14 * interval, "day");
        else if (frequency === RecurrenceFrequency.FIFTEEN_DAYS) cursor = cursor.add(15 * interval, "day");
        else if (frequency === RecurrenceFrequency.MONTHLY) cursor = cursor.add(interval, "month");
        else cursor = cursor.add(interval, "year");
    }

    return dates;
}

export interface DebtInstallmentResponse {
    id: string;
    planId?: string | null;
    loanId?: string | null;
    sequence: number;
    dueDate?: string | null;
    amountDue: number;
    paidAmount: number;
    remaining: number;
    status: DebtInstallmentStatus;
    contact?: { id: string; name: string };
    loan?: { id: string; lender: string; type: string };
}

export const toLoanPlanResponse = (plan: LoanPlan) => ({
    id: plan.id,
    contactId: plan.contactId,
    loanId: plan.loanId ?? null,
    direction: plan.direction,
    amountPerInstallment: plan.amountPerInstallment / 100,
    frequency: plan.frequency,
    intervalCount: plan.intervalCount,
    startDate: plan.startDate,
    installmentCount: plan.installmentCount,
    status: plan.status,
    notes: plan.notes ?? null,
    createdAt: plan.createdAt,
    updatedAt: plan.updatedAt,
    contact: plan.contact ? { id: plan.contact.id, name: plan.contact.name } : undefined,
    loan: plan.loan ? { id: plan.loan.id, lender: plan.loan.lender, type: plan.loan.type } : undefined,
    installments: (plan.installments ?? []).map((item) => ({
        id: item.id,
        planId: item.planId ?? null,
        loanId: item.loanId ?? null,
        sequence: item.sequence,
        dueDate: item.dueDate ?? null,
        amountDue: item.amountDue / 100,
        paidAmount: item.paidAmount / 100,
        status: item.status,
    })),
});

export class LoanPlanService {
    private planRepo = AppDataSourceProd.getRepository(LoanPlan);
    private installmentRepo = AppDataSourceProd.getRepository(DebtInstallment);
    private loanRepo = AppDataSourceProd.getRepository(Loan);
    private notificationRepo = AppDataSourceProd.getRepository(PaymentNotification);
    private auditService = new AuditService();

    async createForContact(
        userId: UuidSchema,
        contactId: UuidSchema,
        data: CreateLoanPlanOutput & { direction: "GIVEN" | "RECEIVED" }
    ): Promise<LoanPlan> {
        const queryRunner = AppDataSourceProd.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const manager = queryRunner.manager;
            const contact = await manager.findOne(Contact, { where: { id: contactId, userId } });
            if (!contact) throw new NotFoundError("Contacto no encontrado");

            const loans = await manager
                .createQueryBuilder(Loan, "loan")
                .setLock("pessimistic_write")
                .where("loan.userId = :userId", { userId })
                .andWhere("loan.contactId = :contactId", { contactId })
                .andWhere("loan.type = :type", { type: data.direction })
                .andWhere("loan.status != :cancelled", { cancelled: "CANCELLED" })
                .getMany();

            const movements = loans.length
                ? await manager.find(LoanMovement, {
                      where: { loan: { id: In(loans.map((loan) => loan.id)) } },
                  })
                : [];
            const byLoan = new Map<string, any[]>();
            for (const movement of movements as any[]) {
                const list = byLoan.get(movement.loanId) ?? [];
                list.push(movement);
                byLoan.set(movement.loanId, list);
            }
            const debtInCents = loans.reduce((sum, loan) => {
                loan.movements = byLoan.get(loan.id) ?? [];
                return sum + calculateLoanPaymentStatus(loan).totalRemainingInCents;
            }, 0);

            const planTotal = data.amountPerInstallment * data.installmentCount;
            if (planTotal > debtInCents) {
                throw new ConflictError(
                    `El plan excede la deuda pendiente. Máximo planificable: ${debtInCents / 100}`
                );
            }

            const dates = buildDates(
                data.startDate,
                data.frequency,
                data.intervalCount,
                data.installmentCount
            );

            const plan = await manager.save(
                manager.create(LoanPlan, {
                    userId,
                    contactId,
                    loanId: null,
                    direction: data.direction as any,
                    amountPerInstallment: data.amountPerInstallment,
                    frequency: data.frequency,
                    intervalCount: data.intervalCount,
                    startDate: data.startDate,
                    installmentCount: data.installmentCount,
                    status: LoanPlanStatus.ACTIVE,
                    notes: data.notes ?? null,
                })
            );

            await manager.save(
                dates.map((dueDate, index) =>
                    manager.create(DebtInstallment, {
                        contactId,
                        loanId: null,
                        planId: plan.id,
                        sequence: index + 1,
                        dueDate,
                        amountDue: data.amountPerInstallment,
                        principalDue: data.amountPerInstallment,
                        paidAmount: 0,
                        status: DebtInstallmentStatus.PENDING,
                    })
                )
            );

            await this.auditService.log(
                userId,
                "LOAN_PLAN",
                plan.id,
                "CREATE_CONTACT_PLAN",
                {
                    after: {
                        contactId,
                        amountPerInstallment: data.amountPerInstallment,
                        installmentCount: data.installmentCount,
                        frequency: data.frequency,
                    },
                    reason: data.notes,
                },
                manager
            );

            const created = await manager.findOneOrFail(LoanPlan, {
                where: { id: plan.id },
                relations: ["installments", "contact"],
            });
            await queryRunner.commitTransaction();
            return created;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async createForLoan(
        userId: UuidSchema,
        loanId: UuidSchema,
        data: CreateLoanPlanOutput
    ): Promise<LoanPlan> {
        const queryRunner = AppDataSourceProd.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const manager = queryRunner.manager;
            const loan = await manager.findOne(Loan, {
                where: { id: loanId, userId },
                relations: ["movements", "contact"],
            });
            if (!loan) throw new NotFoundError("Préstamo no encontrado");
            if (!loan.contactId) throw new ConflictError("El préstamo no tiene contacto");
            if (loan.status === "CANCELLED") throw new ConflictError("El préstamo está cancelado");

            const remaining = calculateLoanPaymentStatus(loan).totalRemainingInCents;
            const planTotal = data.amountPerInstallment * data.installmentCount;
            if (planTotal > remaining) {
                throw new ConflictError(
                    `El plan excede la deuda pendiente. Máximo planificable: ${remaining / 100}`
                );
            }

            const dates = buildDates(
                data.startDate,
                data.frequency,
                data.intervalCount,
                data.installmentCount
            );

            const plan = await manager.save(
                manager.create(LoanPlan, {
                    userId,
                    contactId: loan.contactId,
                    loanId: loan.id,
                    direction: loan.type,
                    amountPerInstallment: data.amountPerInstallment,
                    frequency: data.frequency,
                    intervalCount: data.intervalCount,
                    startDate: data.startDate,
                    installmentCount: data.installmentCount,
                    status: LoanPlanStatus.ACTIVE,
                    notes: data.notes ?? null,
                })
            );

            const installments = dates.map((dueDate, index) =>
                manager.create(DebtInstallment, {
                    contactId: loan.contactId!,
                    loanId: loan.id,
                    planId: plan.id,
                    sequence: index + 1,
                    dueDate,
                    amountDue: data.amountPerInstallment,
                    principalDue: data.amountPerInstallment,
                    paidAmount: 0,
                    status: DebtInstallmentStatus.PENDING,
                })
            );
            await manager.save(installments);

            await this.auditService.log(
                userId,
                "LOAN_PLAN",
                plan.id,
                "CREATE",
                {
                    after: {
                        loanId: loan.id,
                        amountPerInstallment: data.amountPerInstallment,
                        installmentCount: data.installmentCount,
                        frequency: data.frequency,
                    },
                    reason: data.notes,
                },
                manager
            );

            const created = await manager.findOneOrFail(LoanPlan, {
                where: { id: plan.id },
                relations: ["installments", "contact", "loan"],
            });

            await queryRunner.commitTransaction();
            return created;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async listForLoan(userId: UuidSchema, loanId: UuidSchema): Promise<LoanPlan[]> {
        return this.planRepo.find({
            where: { userId, loanId },
            relations: ["installments", "contact", "loan"],
            order: { createdAt: "DESC" },
        });
    }

    async listForContact(userId: UuidSchema, contactId: UuidSchema): Promise<LoanPlan[]> {
        return this.planRepo.find({
            where: { userId, contactId, loanId: IsNull() },
            relations: ["installments", "contact"],
            order: { createdAt: "DESC" },
        });
    }

    async updatePlan(
        userId: UuidSchema,
        planId: UuidSchema,
        data: {
            amountPerInstallment?: number;
            installmentCount?: number;
            startDate?: string;
            frequency?: RecurrenceFrequency;
            intervalCount?: number;
            notes?: string | null;
        }
    ): Promise<LoanPlan> {
        const queryRunner = AppDataSourceProd.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const manager = queryRunner.manager;
            const plan = await manager.findOne(LoanPlan, {
                where: { id: planId, userId },
                relations: ["installments", "loan", "loan.movements", "contact"],
            });
            if (!plan) throw new NotFoundError("Plan no encontrado");
            if (plan.status === LoanPlanStatus.CANCELLED) {
                throw new ConflictError("No se puede editar un plan cancelado");
            }

            const partial = (plan.installments ?? []).some(
                (item) =>
                    item.paidAmount > 0 &&
                    item.status !== DebtInstallmentStatus.PAID &&
                    item.status !== DebtInstallmentStatus.CANCELLED
            );
            if (partial) {
                throw new ConflictError(
                    "No se puede recalcular un plan con cuotas parciales. Completa o cancela esas cuotas primero."
                );
            }

            const amount = data.amountPerInstallment ?? plan.amountPerInstallment;
            const count = data.installmentCount ?? plan.installmentCount;
            const startDate = data.startDate ?? plan.startDate;
            const frequency = data.frequency ?? plan.frequency;
            const intervalCount = data.intervalCount ?? plan.intervalCount;
            const planTotal = amount * count;

            let remaining = 0;
            if (plan.loanId) {
                const loan = await manager.findOne(Loan, {
                    where: { id: plan.loanId, userId },
                    relations: ["movements"],
                });
                if (!loan) throw new NotFoundError("Préstamo no encontrado");
                remaining = calculateLoanPaymentStatus(loan).totalRemainingInCents;
            } else {
                const loans = await manager
                    .createQueryBuilder(Loan, "loan")
                    .where("loan.userId = :userId", { userId })
                    .andWhere("loan.contactId = :contactId", { contactId: plan.contactId })
                    .andWhere("loan.type = :type", { type: plan.direction })
                    .andWhere("loan.status != :cancelled", { cancelled: "CANCELLED" })
                    .getMany();
                const movements = loans.length
                    ? await manager.find(LoanMovement, {
                          where: { loan: { id: In(loans.map((loan) => loan.id)) } },
                      })
                    : [];
                const byLoan = new Map<string, LoanMovement[]>();
                for (const movement of movements) {
                    const list = byLoan.get(movement.loanId) ?? [];
                    list.push(movement);
                    byLoan.set(movement.loanId, list);
                }
                remaining = loans.reduce((sum, loan) => {
                    loan.movements = byLoan.get(loan.id) ?? [];
                    return sum + calculateLoanPaymentStatus(loan).totalRemainingInCents;
                }, 0);
            }

            if (planTotal > remaining) {
                throw new ConflictError(
                    `El plan excede la deuda pendiente. Máximo planificable: ${remaining / 100}`
                );
            }

            const installments = plan.installments ?? [];
            const unpaidIds = installments
                .filter(
                    (item) =>
                        item.status === DebtInstallmentStatus.PENDING ||
                        item.status === DebtInstallmentStatus.OVERDUE
                )
                .map((item) => item.id);

            if (unpaidIds.length) {
                await manager.update(
                    DebtInstallment,
                    { id: In(unpaidIds) },
                    { status: DebtInstallmentStatus.CANCELLED }
                );
            }

            const maxSequence = installments.reduce(
                (max, item) => Math.max(max, item.sequence),
                0
            );
            const dates = buildDates(startDate, frequency, intervalCount, count);
            plan.amountPerInstallment = amount;
            plan.installmentCount = count;
            plan.startDate = startDate;
            plan.frequency = frequency;
            plan.intervalCount = intervalCount;
            if (plan.status === LoanPlanStatus.COMPLETED) plan.status = LoanPlanStatus.ACTIVE;
            if (data.notes !== undefined) plan.notes = data.notes;
            await manager.save(plan);

            for (const [index, dueDate] of dates.entries()) {
                await manager.query(
                    `INSERT INTO "debt_installments"
                        ("contactId", "loanId", "planId", "sequence", "dueDate", "amountDue", "principalDue", "paidAmount", "status")
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                    [
                        plan.contactId,
                        plan.loanId ?? null,
                        plan.id,
                        maxSequence + index + 1,
                        dueDate,
                        amount,
                        amount,
                        0,
                        DebtInstallmentStatus.PENDING,
                    ]
                );
            }

            await this.auditService.log(
                userId,
                "LOAN_PLAN",
                plan.id,
                "UPDATE",
                {
                    after: {
                        amountPerInstallment: amount,
                        installmentCount: count,
                        startDate,
                        frequency,
                    },
                },
                manager
            );

            const updated = await manager.findOneOrFail(LoanPlan, {
                where: { id: plan.id },
                relations: ["installments", "contact", "loan"],
            });
            await queryRunner.commitTransaction();
            return updated;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async setStatus(
        userId: UuidSchema,
        planId: UuidSchema,
        status: LoanPlanStatus.ACTIVE | LoanPlanStatus.PAUSED
    ): Promise<LoanPlan> {
        const plan = await this.planRepo.findOne({ where: { id: planId, userId } });
        if (!plan) throw new NotFoundError("Plan no encontrado");
        if (plan.status === LoanPlanStatus.CANCELLED) {
            throw new ConflictError("No se puede reactivar un plan cancelado");
        }
        plan.status = status;
        return this.planRepo.save(plan);
    }

    async cancel(userId: UuidSchema, planId: UuidSchema, reason?: string): Promise<LoanPlan> {
        const plan = await this.planRepo.findOne({
            where: { id: planId, userId },
            relations: ["installments"],
        });
        if (!plan) throw new NotFoundError("Plan no encontrado");
        if (plan.status === LoanPlanStatus.CANCELLED) return plan;

        plan.status = LoanPlanStatus.CANCELLED;
        await this.planRepo.save(plan);

        await this.installmentRepo
            .createQueryBuilder()
            .update(DebtInstallment)
            .set({ status: DebtInstallmentStatus.CANCELLED })
            .where("planId = :planId", { planId })
            .andWhere("status IN (:...statuses)", {
                statuses: [DebtInstallmentStatus.PENDING, DebtInstallmentStatus.PARTIAL, DebtInstallmentStatus.OVERDUE],
            })
            .execute();

        await this.auditService.log(userId, "LOAN_PLAN", plan.id, "CANCEL", {
            before: { status: LoanPlanStatus.ACTIVE },
            after: { status: plan.status },
            reason,
        });

        return plan;
    }

    async refreshAllOverdue(): Promise<void> {
        const rows: Array<{ userId: string }> = await this.installmentRepo.query(
            `SELECT DISTINCT c."userId" AS "userId"
             FROM "debt_installments" i
             JOIN "contacts" c ON c."id" = i."contactId"
             WHERE i."dueDate" < CURRENT_DATE
               AND i."status" IN ('PENDING', 'PARTIAL')`
        );
        for (const row of rows) {
            await this.refreshOverdue(row.userId as UuidSchema);
        }
    }

    async refreshOverdue(userId: UuidSchema): Promise<void> {
        const today = dayjs().format("YYYY-MM-DD");
        await this.installmentRepo
            .createQueryBuilder()
            .update(DebtInstallment)
            .set({ status: DebtInstallmentStatus.OVERDUE })
            .where("contactId IN (SELECT id FROM contacts WHERE \"userId\" = :userId)", { userId })
            .andWhere("dueDate < :today", { today })
            .andWhere("status IN (:...statuses)", {
                statuses: [DebtInstallmentStatus.PENDING, DebtInstallmentStatus.PARTIAL],
            })
            .execute();

        await this.loanRepo
            .createQueryBuilder()
            .update(Loan)
            .set({ status: "OVERDUE" as any })
            .where("userId = :userId", { userId })
            .andWhere("status NOT IN (:...keep)", { keep: ["PAID", "CANCELLED"] })
            .andWhere(
                "id IN (SELECT \"loanId\" FROM debt_installments WHERE status = :overdue AND \"loanId\" IS NOT NULL)",
                { overdue: DebtInstallmentStatus.OVERDUE }
            )
            .execute();

        const overdue = await this.installmentRepo.find({
            where: {
                status: DebtInstallmentStatus.OVERDUE,
                dueDate: LessThan(today),
                contact: { userId },
            },
            relations: ["contact", "loan"],
            order: { dueDate: "ASC" },
            take: 200,
        });

        for (const installment of overdue) {
            const existing = await this.notificationRepo.findOneBy({ installmentId: installment.id });
            if (existing) continue;

            const person = installment.contact?.name ?? installment.loan?.lender ?? "Préstamo";
            await this.notificationRepo.save(
                this.notificationRepo.create({
                    userId,
                    installmentId: installment.id,
                    title: "Cuota de préstamo vencida",
                    message: `La cuota ${installment.sequence} de ${person} por S/ ${(
                        installment.amountDue / 100
                    ).toFixed(2)} venció el ${installment.dueDate}.`,
                })
            );
        }
    }

    async listInstallmentsForMonth(
        userId: UuidSchema,
        month?: string
    ): Promise<DebtInstallmentResponse[]> {
        await this.refreshOverdue(userId);
        const target = month ?? dayjs().format("YYYY-MM");
        const from = dayjs(`${target}-01`).startOf("month").format("YYYY-MM-DD");
        const to = dayjs(`${target}-01`).endOf("month").format("YYYY-MM-DD");

        const rows = await this.installmentRepo.find({
            where: {
                contact: { userId },
                dueDate: Between(from, to),
            },
            relations: ["plan", "loan", "contact"],
            order: { dueDate: "ASC", sequence: "ASC" },
        });

        const filtered = rows.filter(
            (item) =>
                item.dueDate &&
                item.dueDate >= from &&
                item.dueDate <= to &&
                item.status !== DebtInstallmentStatus.CANCELLED &&
                (!item.plan || item.plan.status === LoanPlanStatus.ACTIVE)
        );

        return filtered.map((item) => ({
            id: item.id,
            planId: item.planId,
            loanId: item.loanId,
            sequence: item.sequence,
            dueDate: item.dueDate,
            amountDue: item.amountDue / 100,
            paidAmount: item.paidAmount / 100,
            remaining: Math.max(0, (item.amountDue - item.paidAmount) / 100),
            status: item.status,
            contact: item.contact ? { id: item.contact.id, name: item.contact.name } : undefined,
            loan: item.loan
                ? { id: item.loan.id, lender: item.loan.lender, type: item.loan.type }
                : undefined,
        }));
    }
}
