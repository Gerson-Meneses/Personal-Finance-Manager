import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import dayjs from "dayjs";
import { AppDataSourceProd } from "../src/database/dataBaseDev";
import { Account } from "../src/entities/Account.entity";
import { Category } from "../src/entities/Category.entity";
import { Transaction } from "../src/entities/Transaction.entity";
import { User } from "../src/entities/User.entity";
import { AttachmentService } from "../src/services/attachmentService";
import { BankImportService } from "../src/services/bankImportService";
import { BudgetService } from "../src/services/budgetService";
import { CategoryService } from "../src/services/categoryService";
import { ProductService } from "../src/services/productService";
import { TagService } from "../src/services/tagService";
import { TransactionService } from "../src/services/transactionService";
import { importBankLinesSchema } from "../src/schemas/bankImport.schema";
import { upsertBudgetSchema } from "../src/schemas/budget.schema";
import {
    BankLineStatus,
    TypeAccount,
    TypeTransaction,
} from "../src/utils/Enums";

const hasDatabase = Boolean(process.env.TEST_DATABASE_URL);
const describeDb = hasDatabase ? describe : describe.skip;

describeDb("funcionalidades nuevas: etiquetas, productos, adjuntos, conciliación y presupuestos", () => {
    let userId = "";
    let accountId = "";
    let expenseCategoryId = "";
    let transportCategoryId = "";
    let incomeCategoryId = "";
    let parentCategoryId = "";
    let childCategoryId = "";
    let tagAId = "";
    let tagBId = "";
    let firstTransactionId = "";
    const suffix = Date.now().toString().slice(-8);
    const today = dayjs().format("YYYY-MM-DD");
    const month = dayjs().format("YYYY-MM");

    const tagService = new TagService();
    const transactionService = new TransactionService();
    const categoryService = new CategoryService();
    const productService = new ProductService();
    const attachmentService = new AttachmentService();
    const bankService = new BankImportService();
    const budgetService = new BudgetService();

    beforeAll(async () => {
        if (!AppDataSourceProd.isInitialized) await AppDataSourceProd.initialize();

        const user = await AppDataSourceProd.getRepository(User).save(
            AppDataSourceProd.getRepository(User).create({
                name: "Integration Features User",
                birthDate: new Date("1990-01-01"),
                phone: Number(`6${suffix}`),
                country: "PE",
                isAdmin: false,
                is_verified: true,
            })
        );
        userId = user.id;

        const account = await AppDataSourceProd.getRepository(Account).save(
            AppDataSourceProd.getRepository(Account).create({
                name: "Integration Features Account",
                type: TypeAccount.DEBIT,
                balance: 100_000_000,
                color: "#38bdf8",
                icon: "wallet",
                user,
            })
        );
        accountId = account.id;

        const parent = await categoryService.createCategory(
            {
                name: `INTEGRATION PARENT ${suffix}`,
                type: TypeTransaction.EXPENSE,
                color: "#a78bfa",
                icon: "Folder",
            } as any,
            userId
        );
        parentCategoryId = parent.id;

        const child = await categoryService.createCategory(
            {
                name: `INTEGRATION CHILD ${suffix}`,
                type: TypeTransaction.EXPENSE,
                color: "#c4b5fd",
                icon: "Tag",
                parentCategoryId,
            } as any,
            userId
        );
        childCategoryId = child.id;

        const expense = await categoryService.createCategory(
            {
                name: `INTEGRATION FOOD ${suffix}`,
                type: TypeTransaction.EXPENSE,
                color: "#22c55e",
                icon: "Utensils",
            } as any,
            userId
        );
        expenseCategoryId = expense.id;

        const transport = await categoryService.createCategory(
            {
                name: `INTEGRATION TRANSPORT ${suffix}`,
                type: TypeTransaction.EXPENSE,
                color: "#38bdf8",
                icon: "Car",
            } as any,
            userId
        );
        transportCategoryId = transport.id;

        const income = await categoryService.createCategory(
            {
                name: `INTEGRATION INCOME ${suffix}`,
                type: TypeTransaction.INCOME,
                color: "#22c55e",
                icon: "BadgeDollarSign",
            } as any,
            userId
        );
        incomeCategoryId = income.id;
    }, 30000);

    afterAll(async () => {
        if (!userId) return;

        await AppDataSourceProd.query(`DELETE FROM payment_notifications WHERE "userId" = $1`, [userId]);
        await AppDataSourceProd.query(`DELETE FROM transaction_attachments WHERE "userId" = $1`, [userId]);
        await AppDataSourceProd.query(`DELETE FROM transaction_items WHERE "userId" = $1`, [userId]);
        await AppDataSourceProd.query(
            `DELETE FROM transaction_split_tags WHERE "splitId" IN (SELECT id FROM transaction_splits WHERE "transactionId" IN (SELECT id FROM transactions WHERE "userId" = $1))`,
            [userId]
        );
        await AppDataSourceProd.query(
            `DELETE FROM transaction_tags WHERE "transactionId" IN (SELECT id FROM transactions WHERE "userId" = $1)`,
            [userId]
        );
        await AppDataSourceProd.query(
            `DELETE FROM transaction_splits WHERE "transactionId" IN (SELECT id FROM transactions WHERE "userId" = $1)`,
            [userId]
        );
        await AppDataSourceProd.query(`DELETE FROM bank_statement_lines WHERE "userId" = $1`, [userId]);
        await AppDataSourceProd.query(`DELETE FROM budgets WHERE "userId" = $1`, [userId]);
        await AppDataSourceProd.query(`DELETE FROM transactions WHERE "userId" = $1`, [userId]);
        await AppDataSourceProd.query(`DELETE FROM tags WHERE "userId" = $1`, [userId]);
        await AppDataSourceProd.query(`DELETE FROM categories WHERE "userId" = $1 AND "parentCategoryId" IS NOT NULL`, [userId]);
        await AppDataSourceProd.query(`DELETE FROM categories WHERE "userId" = $1`, [userId]);
        await AppDataSourceProd.query(`DELETE FROM accounts WHERE "userId" = $1`, [userId]);
        await AppDataSourceProd.query(`DELETE FROM users WHERE id = $1`, [userId]);

        if (AppDataSourceProd.isInitialized) await AppDataSourceProd.destroy();
    }, 30000);

    test("crea un nivel de subcategorías y bloquea un segundo nivel", async () => {
        expect(childCategoryId).toBeTruthy();
        const child = await AppDataSourceProd.getRepository(Category).findOneByOrFail({
            id: childCategoryId,
        });
        expect(child.parentCategoryId).toBe(parentCategoryId);

        let message = "";
        try {
            await categoryService.createCategory(
                {
                    name: `INTEGRATION GRANDCHILD ${suffix}`,
                    type: TypeTransaction.EXPENSE,
                    color: "#94a3b8",
                    icon: "Tag",
                    parentCategoryId: childCategoryId,
                } as any,
                userId
            );
        } catch (error) {
            message = error instanceof Error ? error.message : String(error);
        }
        expect(message).toMatch(/nivel/i);
    }, 30000);

    test("gestiona etiquetas, evita duplicados y calcula uso", async () => {
        const tagA = await tagService.createTag(
            { name: `Viaje ${suffix}`, color: "#8b5cf6" },
            userId as any
        );
        const tagB = await tagService.createTag(
            { name: `Trabajo ${suffix}`, color: "#0ea5e9" },
            userId as any
        );
        tagAId = tagA.id;
        tagBId = tagB.id;

        let duplicateMessage = "";
        try {
            await tagService.createTag(
                { name: `viaje ${suffix}`, color: "#8b5cf6" },
                userId as any
            );
        } catch (error) {
            duplicateMessage = error instanceof Error ? error.message : String(error);
        }
        expect(duplicateMessage).toMatch(/etiqueta/i);

        const updated = await tagService.updateTag(userId as any, tagA.id as any, {
            name: `Viaje actualizado ${suffix}`,
        });
        expect(updated.name).toBe(`Viaje actualizado ${suffix}`);

        const temporary = await tagService.createTag(
            { name: `Temporal ${suffix}` },
            userId as any
        );
        await tagService.deleteTag(userId as any, temporary.id as any);
        let deletedMessage = "";
        try {
            await tagService.getTagById(temporary.id as any, userId as any);
        } catch (error) {
            deletedMessage = error instanceof Error ? error.message : String(error);
        }
        expect(deletedMessage).toMatch(/no encontrada/i);
    }, 30000);

    test("registra transacción con etiquetas, divisiones, productos y comercio", async () => {
        const created = await transactionService.createTransaction(
            {
                name: `Integration Purchase ${suffix}`,
                type: TypeTransaction.EXPENSE,
                amount: 10_000,
                date: today,
                categoryId: expenseCategoryId,
                accountId,
                isRecurrent: false,
                tagIds: [tagAId],
                merchantName: "Supermercado E2E",
                merchantAddress: "Av. Test 123",
                merchantRuc: "20123456789",
                items: [
                    {
                        name: "Leche E2E",
                        quantity: 2,
                        unitPrice: 5_000,
                        total: 10_000,
                    },
                ],
                splits: [
                    {
                        categoryId: transportCategoryId,
                        amount: 4_000,
                        description: "Taxi",
                        tagIds: [tagBId],
                    },
                    { categoryId: expenseCategoryId, amount: 6_000 },
                ],
            } as any,
            userId as any
        );
        firstTransactionId = created.id;

        const saved = await AppDataSourceProd.getRepository(Transaction).findOneOrFail({
            where: { id: created.id },
            relations: ["tags", "splits", "splits.category", "splits.tags", "items"],
        });

        expect(saved.tags.map((tag) => tag.id)).toContain(tagAId);
        expect(saved.splits).toHaveLength(2);
        expect(saved.splits.some((split) => split.tags.some((tag) => tag.id === tagBId))).toBe(true);
        expect(saved.items).toHaveLength(1);
        expect(saved.items[0].normalizedName).toBe("LECHE E2E");
        expect(saved.merchantName).toBe("Supermercado E2E");

        const second = await transactionService.createTransaction(
            {
                name: `Integration Purchase 2 ${suffix}`,
                type: TypeTransaction.EXPENSE,
                amount: 7_000,
                date: dayjs().add(1, "day").format("YYYY-MM-DD"),
                categoryId: expenseCategoryId,
                accountId,
                isRecurrent: false,
                items: [
                    { name: "LECHE E2E", quantity: 1, unitPrice: 7_000, total: 7_000 },
                ],
                merchantName: "Tienda E2E",
            } as any,
            userId as any
        );
        expect(second.id).toBeTruthy();
    }, 30000);

    test("agrega productos por nombre normalizado y muestra su detalle", async () => {
        const products = await productService.getProducts(userId as any, {
            search: "LECHE E2E",
            order: "recent",
        });
        const product = products.items.find((item) => item.normalizedName === "LECHE E2E");

        expect(product).toBeTruthy();
        expect(product?.purchaseCount).toBe(2);
        expect(product?.bestPrice).toBe(50);
        expect(product?.averagePrice).toBe(60);
        expect(product?.lastPrice).toBe(70);

        const detail = await productService.getProductDetail(userId as any, "leche e2e");
        expect(detail.prices).toHaveLength(2);
        expect(detail.purchaseCount).toBe(2);
        expect(detail.bestPrice).toBe(50);
    }, 30000);

    test("sube, lista y elimina adjuntos de una transacción", async () => {
        const data = Buffer.from([1, 2, 3, 4, 5]);
        const attachment = await attachmentService.uploadAttachment(
            firstTransactionId as any,
            userId as any,
            {
                name: "recibo.png",
                type: "image/png",
                size: data.length,
                data,
            }
        );

        const list = await attachmentService.listAttachments(
            firstTransactionId as any,
            userId as any
        );
        expect(list).toHaveLength(1);
        expect(list[0].id).toBe(attachment.id);

        const file = await attachmentService.getAttachmentFile(
            attachment.id as any,
            userId as any
        );
        expect(Buffer.from(file.data).equals(data)).toBe(true);

        await attachmentService.deleteAttachment(attachment.id as any, userId as any);
        expect(
            await attachmentService.listAttachments(firstTransactionId as any, userId as any)
        ).toHaveLength(0);

        let invalidMessage = "";
        try {
            await attachmentService.uploadAttachment(
                firstTransactionId as any,
                userId as any,
                {
                    name: "virus.exe",
                    type: "application/x-msdownload",
                    size: data.length,
                    data,
                }
            );
        } catch (error) {
            invalidMessage = error instanceof Error ? error.message : String(error);
        }
        expect(invalidMessage).toMatch(/tipo de archivo/i);
    }, 30000);

    test("importa movimientos bancarios, evita duplicados y crea transacciones", async () => {
        const payload = importBankLinesSchema.parse({
            accountId,
            lines: [
                {
                    date: today,
                    description: `Pago luz ${suffix}`,
                    amount: 100.5,
                    type: TypeTransaction.EXPENSE,
                    reference: "REF-LUZ",
                },
            ],
        });

        const firstImport = await bankService.importLines(userId as any, payload);
        expect(firstImport.imported).toBe(1);
        expect(firstImport.duplicates).toBe(0);

        const secondImport = await bankService.importLines(userId as any, payload);
        expect(secondImport.imported).toBe(0);
        expect(secondImport.duplicates).toBe(1);

        const pending = await bankService.getLines(userId as any, {
            accountId,
            status: BankLineStatus.PENDING,
        });
        const line = pending.lines.find((item) => item.description === `Pago luz ${suffix}`);
        expect(line).toBeTruthy();

        await bankService.ignoreLine(userId as any, line!.id as any);
        const restored = await bankService.restoreLine(userId as any, line!.id as any);
        expect(restored.status).toBe(BankLineStatus.PENDING);

        const imported = await bankService.createTransactionFromLine(
            userId as any,
            line!.id as any,
            { categoryId: expenseCategoryId }
        );
        expect(imported.status).toBe(BankLineStatus.IMPORTED);
        expect(imported.transactionId).toBeTruthy();
    }, 30000);

    test("concilia y desvincula un movimiento bancario con una transacción", async () => {
        const payload = importBankLinesSchema.parse({
            accountId,
            lines: [
                {
                    date: today,
                    description: `Cobro ${suffix}`,
                    amount: 250,
                    type: TypeTransaction.INCOME,
                },
            ],
        });
        await bankService.importLines(userId as any, payload);

        const pending = await bankService.getLines(userId as any, {
            accountId,
            status: BankLineStatus.PENDING,
        });
        const line = pending.lines.find((item) => item.description === `Cobro ${suffix}`);
        expect(line).toBeTruthy();

        const incomeTransaction = await transactionService.createTransaction(
            {
                name: `Cobro ${suffix}`,
                type: TypeTransaction.INCOME,
                amount: 25_000,
                date: today,
                categoryId: incomeCategoryId,
                accountId,
                isRecurrent: false,
            } as any,
            userId as any
        );

        const matched = await bankService.matchLine(
            userId as any,
            line!.id as any,
            incomeTransaction.id as any
        );
        expect(matched.status).toBe(BankLineStatus.MATCHED);
        expect(matched.transactionId).toBe(incomeTransaction.id);

        const unmatched = await bankService.unmatchLine(userId as any, line!.id as any);
        expect(unmatched.status).toBe(BankLineStatus.PENDING);
        expect(unmatched.transactionId).toBeNull();
    }, 30000);

    test("crea presupuesto y calcula gasto real del mes", async () => {
        const payload = upsertBudgetSchema.parse({
            categoryId: expenseCategoryId,
            month,
            amount: 1_000,
        });
        await budgetService.upsertBudget(userId as any, payload);

        const budgets = await budgetService.getBudgets(userId as any, month);
        const budget = budgets.budgets.find((item) => item.category.id === expenseCategoryId);

        expect(budget).toBeTruthy();
        expect(budget?.amount).toBe(1_000);
        expect(budget?.spent).toBeGreaterThan(0);
        expect(budget?.percentage).toBeGreaterThan(0);
    }, 30000);
});
