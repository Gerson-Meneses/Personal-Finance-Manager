import { createHash, randomUUID } from "crypto";
import dayjs from "dayjs";
import { In } from "typeorm";
import { AppDataSourceProd } from "../database/dataBaseDev";
import { Account } from "../entities/Account.entity";
import { BankStatementLine } from "../entities/BankStatementLine.entity";
import { Transaction } from "../entities/Transaction.entity";
import { BadRequestError, ConflictError, NotFoundError } from "../helpers/errors/domain.errors";
import type {
    BankLinesQuery,
    CreateFromBankLineInput,
    ImportBankLinesOutput,
} from "../schemas/bankImport.schema";
import type { UuidSchema } from "../schemas/uuid.schema";
import { BankLineStatus, TransactionReportingImpact, TypeTransaction } from "../utils/Enums";
import { money } from "../utils/normalizarMoney";
import { TransactionService } from "./transactionService";

export interface BankLineCategoryResponse {
    id: string;
    name: string;
    color: string;
    icon?: string | null;
}

export interface BankLineTransactionResponse {
    id: string;
    name: string;
    amount: number;
    date: string;
    type: TypeTransaction;
    category?: BankLineCategoryResponse | null;
    account?: { id: string; name: string } | null;
}

export interface BankLineSuggestionResponse {
    score: number;
    dayDiff: number;
    reasons: string[];
    transaction: BankLineTransactionResponse;
}

export interface BankStatementLineResponse {
    id: string;
    accountId: string;
    account?: { id: string; name: string; type: string } | null;
    date: string;
    description: string;
    amount: number;
    type: TypeTransaction;
    reference: string | null;
    balanceAfter: number | null;
    status: BankLineStatus;
    transactionId: string | null;
    transaction: BankLineTransactionResponse | null;
    importBatchId: string;
    matchedAt: string | null;
    createdAt: string;
    suggestions: BankLineSuggestionResponse[];
}

export interface BankLinesSummary {
    pending: number;
    matched: number;
    imported: number;
    ignored: number;
    total: number;
}

export interface BankLinesResponse {
    lines: BankStatementLineResponse[];
    summary: BankLinesSummary;
}

export interface ImportBankLinesResult {
    imported: number;
    duplicates: number;
    batchId: string;
}

interface SuggestionLine {
    date: string;
    amount: number;
    type: TypeTransaction;
    description: string;
}

interface SuggestionTransaction {
    date: string;
    amount: number;
    type: TypeTransaction;
    name: string;
}

const normalizeText = (value: string) =>
    value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/\s+/g, " ");

const tokenize = (value: string) =>
    new Set(
        normalizeText(value)
            .split(/[^a-z0-9]+/)
            .filter((token) => token.length >= 3)
    );

const tokenSimilarity = (left: string, right: string) => {
    const a = tokenize(left);
    const b = tokenize(right);
    if (!a.size || !b.size) return 0;

    let hits = 0;
    for (const token of a) {
        for (const candidate of b) {
            if (candidate === token || candidate.startsWith(token) || token.startsWith(candidate)) {
                hits += 1;
                break;
            }
        }
    }

    return hits / Math.max(a.size, b.size);
};

export const buildBankLineFingerprint = (params: {
    accountId: string;
    date: string;
    amount: number;
    description: string;
    reference?: string | null;
}) =>
    createHash("sha256")
        .update(
            [
                params.accountId,
                params.date,
                params.amount,
                normalizeText(params.description),
                params.reference ? normalizeText(params.reference) : "",
            ].join("|")
        )
        .digest("hex");

export const computeSuggestionScore = (
    line: SuggestionLine,
    transaction: SuggestionTransaction
): { score: number; dayDiff: number; reasons: string[] } | null => {
    if (line.type !== transaction.type) return null;
    if (line.amount !== transaction.amount) return null;

    const dayDiff = Math.abs(dayjs(line.date).diff(dayjs(transaction.date), "day"));
    if (dayDiff > 7) return null;

    let score = 55;
    const reasons = ["Mismo monto"];

    if (dayDiff === 0) {
        score += 25;
        reasons.push("Misma fecha");
    } else if (dayDiff <= 2) {
        score += 18;
        reasons.push(`Fecha ±${dayDiff}d`);
    } else if (dayDiff <= 5) {
        score += 10;
        reasons.push(`Fecha ±${dayDiff}d`);
    } else {
        score += 5;
        reasons.push("Fecha cercana");
    }

    const similarity = tokenSimilarity(line.description, transaction.name);
    if (similarity >= 0.34) {
        score += Math.round(similarity * 20);
        reasons.push("Nombre similar");
    }

    return { score: Math.min(score, 100), dayDiff, reasons };
};

const toTransactionResponse = (
    transaction: Transaction
): BankLineTransactionResponse => ({
    id: transaction.id,
    name: transaction.name,
    amount: money(transaction.amount),
    date: transaction.date,
    type: transaction.type,
    category: transaction.category
        ? {
            id: transaction.category.id,
            name: transaction.category.name,
            color: transaction.category.color,
            icon: transaction.category.icon ?? null,
        }
        : null,
    account: transaction.account
        ? { id: transaction.account.id, name: transaction.account.name }
        : null,
});

const toLineResponse = (
    line: BankStatementLine,
    suggestions: BankLineSuggestionResponse[] = []
): BankStatementLineResponse => ({
    id: line.id,
    accountId: line.accountId,
    account: line.account
        ? { id: line.account.id, name: line.account.name, type: line.account.type }
        : null,
    date: line.date,
    description: line.description,
    amount: money(line.amount),
    type: line.type,
    reference: line.reference,
    balanceAfter: line.balanceAfter == null ? null : money(line.balanceAfter),
    status: line.status,
    transactionId: line.transactionId,
    transaction: line.transaction ? toTransactionResponse(line.transaction) : null,
    importBatchId: line.importBatchId,
    matchedAt: line.matchedAt ? line.matchedAt.toISOString() : null,
    createdAt: line.createdAt.toISOString(),
    suggestions,
});

export class BankImportService {
    private lineRepo = AppDataSourceProd.getRepository(BankStatementLine);
    private accountRepo = AppDataSourceProd.getRepository(Account);
    private transactionRepo = AppDataSourceProd.getRepository(Transaction);
    private transactionService = new TransactionService();

    private async getLineForUser(
        userId: UuidSchema,
        lineId: string
    ): Promise<BankStatementLine> {
        const line = await this.lineRepo.findOne({
            where: { id: lineId, userId },
            relations: ["account"],
        });
        if (!line) throw new NotFoundError("Movimiento bancario no encontrado");
        return line;
    }

    private async getLineResponse(
        userId: UuidSchema,
        lineId: string
    ): Promise<BankStatementLineResponse> {
        const line = await this.lineRepo.findOne({
            where: { id: lineId, userId },
            relations: ["account", "transaction", "transaction.category", "transaction.account"],
        });
        if (!line) throw new NotFoundError("Movimiento bancario no encontrado");
        return toLineResponse(line);
    }

    private async buildSuggestions(
        userId: UuidSchema,
        lines: BankStatementLine[]
    ): Promise<Map<string, BankLineSuggestionResponse[]>> {
        const result = new Map<string, BankLineSuggestionResponse[]>();
        const pending = lines.filter((line) => line.status === BankLineStatus.PENDING);
        if (pending.length === 0) return result;

        const dates = pending.map((line) => line.date).sort();
        const min = dayjs(dates[0]).subtract(7, "day").format("YYYY-MM-DD");
        const max = dayjs(dates[dates.length - 1]).add(7, "day").format("YYYY-MM-DD");

        const candidates = await this.transactionRepo
            .createQueryBuilder("t")
            .leftJoinAndSelect("t.category", "category")
            .leftJoinAndSelect("t.account", "account")
            .leftJoin(BankStatementLine, "linkedLine", "linkedLine.transactionId = t.id")
            .where("t.userId = :userId", { userId })
            .andWhere("t.type IN (:...types)", {
                types: [TypeTransaction.INCOME, TypeTransaction.EXPENSE],
            })
            .andWhere("t.reportingImpact = :impact", {
                impact: TransactionReportingImpact.REPORTABLE,
            })
            .andWhere("t.date >= :min", { min })
            .andWhere("t.date <= :max", { max })
            .andWhere("linkedLine.id IS NULL")
            .orderBy("t.date", "DESC")
            .limit(5000)
            .getMany();

        const byAccountAmount = new Map<string, Map<number, Transaction[]>>();
        for (const transaction of candidates) {
            const accountId = transaction.account?.id;
            if (!accountId) continue;

            let byAmount = byAccountAmount.get(accountId);
            if (!byAmount) {
                byAmount = new Map();
                byAccountAmount.set(accountId, byAmount);
            }

            const list = byAmount.get(transaction.amount) ?? [];
            list.push(transaction);
            byAmount.set(transaction.amount, list);
        }

        for (const line of pending) {
            const candidatesForAmount =
                byAccountAmount.get(line.accountId)?.get(line.amount) ?? [];

            const suggestions = candidatesForAmount
                .map((transaction) => {
                    const score = computeSuggestionScore(
                        {
                            date: line.date,
                            amount: line.amount,
                            type: line.type,
                            description: line.description,
                        },
                        {
                            date: transaction.date,
                            amount: transaction.amount,
                            type: transaction.type,
                            name: transaction.name,
                        }
                    );

                    return score
                        ? {
                            ...score,
                            transaction: toTransactionResponse(transaction),
                        }
                        : null;
                })
                .filter((item): item is BankLineSuggestionResponse => item !== null)
                .sort((a, b) => {
                    if (b.score !== a.score) return b.score - a.score;
                    return a.dayDiff - b.dayDiff;
                })
                .slice(0, 3);

            result.set(line.id, suggestions);
        }

        return result;
    }

    private async getSummary(
        userId: UuidSchema,
        accountId?: string
    ): Promise<BankLinesSummary> {
        const qb = this.lineRepo
            .createQueryBuilder("b")
            .select("b.status", "status")
            .addSelect("COUNT(b.id)", "count")
            .where("b.userId = :userId", { userId });

        if (accountId) {
            qb.andWhere("b.accountId = :accountId", { accountId });
        }

        const rows = await qb.groupBy("b.status").getRawMany<{
            status: BankLineStatus;
            count: string;
        }>();

        const summary: BankLinesSummary = {
            pending: 0,
            matched: 0,
            imported: 0,
            ignored: 0,
            total: 0,
        };

        for (const row of rows) {
            const count = Number(row.count);
            if (row.status === BankLineStatus.PENDING) summary.pending = count;
            if (row.status === BankLineStatus.MATCHED) summary.matched = count;
            if (row.status === BankLineStatus.IMPORTED) summary.imported = count;
            if (row.status === BankLineStatus.IGNORED) summary.ignored = count;
            summary.total += count;
        }

        return summary;
    }

    async getLines(
        userId: UuidSchema,
        query: BankLinesQuery
    ): Promise<BankLinesResponse> {
        const limit = query.limit ?? 200;

        const qb = this.lineRepo
            .createQueryBuilder("b")
            .leftJoinAndSelect("b.account", "account")
            .leftJoinAndSelect("b.transaction", "transaction")
            .leftJoinAndSelect("transaction.category", "category")
            .leftJoinAndSelect("transaction.account", "transactionAccount")
            .where("b.userId = :userId", { userId });

        if (query.accountId) {
            qb.andWhere("b.accountId = :accountId", { accountId: query.accountId });
        }

        if (query.status) {
            qb.andWhere("b.status = :status", { status: query.status });
        }

        qb.orderBy("b.date", "DESC")
            .addOrderBy("b.createdAt", "DESC")
            .take(limit);

        const [lines, summary] = await Promise.all([
            qb.getMany(),
            this.getSummary(userId, query.accountId),
        ]);

        const suggestions = await this.buildSuggestions(userId, lines);

        return {
            lines: lines.map((line) =>
                toLineResponse(line, suggestions.get(line.id) ?? [])
            ),
            summary,
        };
    }

    async importLines(
        userId: UuidSchema,
        data: ImportBankLinesOutput
    ): Promise<ImportBankLinesResult> {
        const account = await this.accountRepo.findOne({
            where: { id: data.accountId, user: { id: userId } },
        });
        if (!account) throw new NotFoundError("Cuenta no encontrada");

        const batchId = randomUUID();
        const seen = new Set<string>();
        let duplicates = 0;

        const prepared = data.lines
            .map((line) => ({
                ...line,
                reference: line.reference ?? null,
                fingerprint: buildBankLineFingerprint({
                    accountId: data.accountId,
                    date: line.date,
                    amount: line.amount,
                    description: line.description,
                    reference: line.reference,
                }),
            }))
            .filter((line) => {
                if (seen.has(line.fingerprint)) {
                    duplicates += 1;
                    return false;
                }
                seen.add(line.fingerprint);
                return true;
            });

        if (prepared.length === 0) {
            return { imported: 0, duplicates, batchId };
        }

        const existing = await this.lineRepo.find({
            select: ["fingerprint"],
            where: {
                accountId: data.accountId,
                fingerprint: In(prepared.map((line) => line.fingerprint)),
            },
        });

        const existingFingerprints = new Set(existing.map((line) => line.fingerprint));
        const toSave = prepared
            .filter((line) => !existingFingerprints.has(line.fingerprint))
            .map((line) =>
                this.lineRepo.create({
                    userId,
                    accountId: data.accountId,
                    account,
                    date: line.date,
                    description: line.description,
                    amount: line.amount,
                    type: line.type,
                    reference: line.reference,
                    balanceAfter: null,
                    fingerprint: line.fingerprint,
                    status: BankLineStatus.PENDING,
                    importBatchId: batchId,
                })
            );

        duplicates += prepared.length - toSave.length;

        for (let index = 0; index < toSave.length; index += 200) {
            await this.lineRepo.save(toSave.slice(index, index + 200));
        }

        return { imported: toSave.length, duplicates, batchId };
    }

    async matchLine(
        userId: UuidSchema,
        lineId: string,
        transactionId: string
    ): Promise<BankStatementLineResponse> {
        const line = await this.getLineForUser(userId, lineId);
        if (line.status !== BankLineStatus.PENDING) {
            throw new ConflictError("Este movimiento bancario ya fue procesado");
        }

        const transaction = await this.transactionRepo.findOne({
            where: { id: transactionId, user: { id: userId } },
            relations: ["account"],
        });
        if (!transaction) throw new NotFoundError("Transacción no encontrada");
        if (!transaction.account || transaction.account.id !== line.accountId) {
            throw new BadRequestError("La transacción pertenece a otra cuenta");
        }
        if (transaction.amount !== line.amount) {
            throw new BadRequestError("El monto de la transacción no coincide");
        }
        if (transaction.type !== line.type) {
            throw new BadRequestError("El tipo de la transacción no coincide");
        }

        const dayDiff = Math.abs(dayjs(line.date).diff(dayjs(transaction.date), "day"));
        if (dayDiff > 7) {
            throw new BadRequestError("La fecha de la transacción está demasiado lejos");
        }

        const alreadyLinked = await this.lineRepo.findOne({
            where: { transactionId },
        });
        if (alreadyLinked) {
            throw new ConflictError("Esta transacción ya está vinculada a otro movimiento bancario");
        }

        line.transactionId = transaction.id;
        line.status = BankLineStatus.MATCHED;
        line.matchedAt = new Date();
        await this.lineRepo.save(line);

        return this.getLineResponse(userId, line.id);
    }

    async createTransactionFromLine(
        userId: UuidSchema,
        lineId: string,
        data: CreateFromBankLineInput
    ): Promise<BankStatementLineResponse> {
        const line = await this.getLineForUser(userId, lineId);
        if (line.status !== BankLineStatus.PENDING) {
            throw new ConflictError("Este movimiento bancario ya fue procesado");
        }

        const baseName = (data.name ?? line.description).trim();
        const name = baseName.length >= 3
            ? baseName.slice(0, 99)
            : `Movimiento del ${line.date}`;

        if (line.type !== TypeTransaction.INCOME && line.type !== TypeTransaction.EXPENSE) {
            throw new ConflictError(
                "Las transferencias y pagos de tarjeta deben registrarse desde su propio flujo."
            );
        }

        const queryRunner = AppDataSourceProd.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const created = await this.transactionService.createTransaction(
                {
                    name,
                    type: line.type,
                    amount: line.amount,
                    date: data.date ?? line.date,
                    time: "00:00",
                    description: line.description,
                    categoryId: data.categoryId,
                    accountId: line.accountId,
                    isRecurrent: false,
                },
                userId,
                true,
                queryRunner.manager,
                { allowNegativeBalance: true }
            );

            line.transactionId = created.id;
            line.status = BankLineStatus.IMPORTED;
            line.matchedAt = new Date();
            await queryRunner.manager.save(line);

            await queryRunner.commitTransaction();
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }

        return this.getLineResponse(userId, line.id);
    }

    async ignoreLine(
        userId: UuidSchema,
        lineId: string
    ): Promise<BankStatementLineResponse> {
        const line = await this.getLineForUser(userId, lineId);
        if (line.status !== BankLineStatus.PENDING) {
            throw new ConflictError("Solo puedes ignorar movimientos pendientes");
        }
        line.status = BankLineStatus.IGNORED;
        await this.lineRepo.save(line);
        return this.getLineResponse(userId, line.id);
    }

    async restoreLine(
        userId: UuidSchema,
        lineId: string
    ): Promise<BankStatementLineResponse> {
        const line = await this.getLineForUser(userId, lineId);
        if (line.status !== BankLineStatus.IGNORED) {
            throw new ConflictError("Solo puedes restaurar movimientos ignorados");
        }
        line.status = BankLineStatus.PENDING;
        await this.lineRepo.save(line);
        return this.getLineResponse(userId, line.id);
    }

    async unmatchLine(
        userId: UuidSchema,
        lineId: string
    ): Promise<BankStatementLineResponse> {
        const line = await this.getLineForUser(userId, lineId);
        if (line.status !== BankLineStatus.MATCHED) {
            throw new ConflictError("Solo puedes desvincular movimientos conciliados");
        }
        line.status = BankLineStatus.PENDING;
        line.transactionId = null;
        line.matchedAt = null;
        await this.lineRepo.save(line);
        return this.getLineResponse(userId, line.id);
    }
}
