import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import dayjs from "dayjs";
import { AppDataSourceProd } from "../src/database/dataBaseDev";
import { Account } from "../src/entities/Account.entity";
import { Category } from "../src/entities/Category.entity";
import { CreditInstallment } from "../src/entities/CreditInstallment.entity";
import { PaymentNotification } from "../src/entities/PaymentNotification.entity";
import { User } from "../src/entities/User.entity";
import { AlertService } from "../src/services/alertService";
import { RecurringPaymentService } from "../src/services/recurringPaymentService";
import { CreditCardService } from "../src/services/creditCardService";
import { TransactionService } from "../src/services/transactionService";
import { CreditChargeType, CreditDocumentType, CreditTransactionStatus, TypeAccount, TypeTransaction } from "../src/utils/Enums";

const hasDatabase = Boolean(process.env.TEST_DATABASE_URL);
const describeDb = hasDatabase ? describe : describe.skip;

describeDb("tarjetas de credito: pendientes, ciclos, seguros, cuotas y contrato", () => {
    let userId = "";
    let cardId = "";
    let expenseCategoryId = "";
    const suffix = Date.now().toString().slice(-8);
    const today = dayjs().startOf("day");
    const closeDay = today.date();
    const dueDay = Math.min(28, closeDay + 1);

    const transactionService = new TransactionService();
    const creditCardService = new CreditCardService();
    const alertService = new AlertService();
    const recurringService = new RecurringPaymentService();

    const createCard = async (name: string, extra: Partial<Account> = {}) => {
        const user = await AppDataSourceProd.getRepository(User).findOneByOrFail({ id: userId });
        return await AppDataSourceProd.getRepository(Account).save(
            AppDataSourceProd.getRepository(Account).create({
                name,
                type: TypeAccount.CREDIT,
                balance: 100_000,
                creditLimit: 100_000,
                overdraft: 0,
                billingCloseDay: closeDay,
                paymentDueDay: dueDay,
                desgravamenRate: 2,
                desgravamenMaxAmount: 500,
                tea: 24,
                user,
                ...extra,
            })
        );
    };

    const createCreditExpense = async (amount: number, name: string) => {
        const transaction = await transactionService.createTransaction(
            {
                name,
                type: TypeTransaction.EXPENSE,
                amount,
                date: today.format("YYYY-MM-DD"),
                accountId: cardId,
                categoryId: expenseCategoryId,
                merchantName: name,
                isRecurrent: false,
            } as any,
            userId
        );
        return transaction;
    };

    beforeAll(async () => {
        if (!AppDataSourceProd.isInitialized) await AppDataSourceProd.initialize();

        const user = await AppDataSourceProd.getRepository(User).save(
            AppDataSourceProd.getRepository(User).create({
                name: "Credit Card Integration User",
                birthDate: new Date("1990-01-01"),
                phone: Number(`7${suffix}`),
                country: "PE",
                isAdmin: false,
                is_verified: true,
            })
        );
        userId = user.id;

        const category = await AppDataSourceProd.getRepository(Category).save(
            AppDataSourceProd.getRepository(Category).create({
                name: `CREDIT CARD EXPENSE ${suffix}`,
                type: TypeTransaction.EXPENSE,
                user,
            })
        );
        expenseCategoryId = category.id;

        const card = await createCard("Test Card");
        cardId = card.id;
    }, 30000);

    afterAll(async () => {
        if (!userId) return;
        await AppDataSourceProd.query(`DELETE FROM payment_notifications WHERE "userId" = $1`, [userId]);
        await AppDataSourceProd.query(`DELETE FROM credit_card_documents WHERE "userId" = $1`, [userId]);
        await AppDataSourceProd.query(`DELETE FROM credit_card_charges WHERE "userId" = $1`, [userId]);
        await AppDataSourceProd.query(
            `DELETE FROM credit_installments WHERE "planId" IN (SELECT id FROM credit_installment_plans WHERE "userId" = $1)`,
            [userId]
        );
        await AppDataSourceProd.query(`DELETE FROM credit_installment_plans WHERE "userId" = $1`, [userId]);
        await AppDataSourceProd.query(`DELETE FROM transactions WHERE "userId" = $1`, [userId]);
        await AppDataSourceProd.query(`DELETE FROM categories WHERE "id" = $1`, [expenseCategoryId]);
        await AppDataSourceProd.query(`DELETE FROM accounts WHERE "id" = $1`, [cardId]);
        await AppDataSourceProd.query(`DELETE FROM users WHERE id = $1`, [userId]);
        if (AppDataSourceProd.isInitialized) await AppDataSourceProd.destroy();
    });

    test("crea una compra pendiente y descuenta el credito disponible", async () => {
        const before = await AppDataSourceProd.getRepository(Account).findOneByOrFail({ id: cardId });
        const transaction = await createCreditExpense(10_000, "Play Store");

        const after = await AppDataSourceProd.getRepository(Account).findOneByOrFail({ id: cardId });
        expect(transaction.creditStatus).toBe(CreditTransactionStatus.PENDING);
        expect(transaction.authorizedAmount).toBe(100);
        expect(after.balance).toBe(before.balance - 10_000);

        const summary = await creditCardService.getSummary(cardId, userId);
        expect(summary.pendingCount).toBe(1);
        expect(summary.pending[0].name).toBe("Play Store");

        await alertService.refreshAlerts(userId);
        const notification = await AppDataSourceProd.getRepository(PaymentNotification).findOneBy({
            userId,
            kind: "CARD_PENDING",
        });
        expect(notification).toBeTruthy();
        expect(notification?.accountId).toBe(cardId);
        expect(notification?.readAt).toBeFalsy();
    });

    test("confirma una compra con monto real y aprende el ajuste del comercio", async () => {
        const pending = await creditCardService.getSummary(cardId, userId);
        const transaction = pending.pending[0];

        await creditCardService.confirmTransaction(userId, transaction.id, { amount: 12_000 });
        const summary = await creditCardService.getSummary(cardId, userId);

        expect(summary.pendingCount).toBe(0);
        expect(summary.totalDebt).toBe(122.4);
        expect(summary.billedDebt).toBe(122.4);
        expect(summary.charges.some((charge) => charge.type === CreditChargeType.INSURANCE)).toBe(true);
        expect(summary.currentStatement?.total).toBe(122.4);
        expect(summary.currentStatement?.charges).toBe(2.4);
        expect(summary.merchantAdjustments[0]?.merchantName).toBe("Play Store");
        expect(summary.merchantAdjustments[0]?.averageDelta).toBe(20);
        expect(summary.merchantAdjustments[0]?.averagePercent).toBe(20);

        const insurance = summary.charges.find((charge) => charge.type === CreditChargeType.INSURANCE);
        expect(insurance?.fixed).toBe(true);
        expect(insurance?.recurring).toBe(true);

        const projection = await recurringService.getMonthProjection(
            userId,
            insurance!.dueDate.slice(0, 7)
        );
        expect(
            projection.creditCardForecast.some(
                (item) => item.source === "INSURANCE" && item.fixed && item.recurring
            )
        ).toBe(true);

        let fixedMessage = "";
        try {
            await creditCardService.updateCharge(userId, cardId, insurance!.id, { amount: 1 });
        } catch (error) {
            fixedMessage = error instanceof Error ? error.message : String(error);
        }
        expect(fixedMessage).toMatch(/recurrente fijo/i);

        await alertService.refreshAlerts(userId);
        const notification = await AppDataSourceProd.getRepository(PaymentNotification).findOneBy({
            userId,
            kind: "CARD_PENDING",
        });
        expect(notification?.readAt).toBeTruthy();
    });

    test("permite agregar, editar y eliminar cargos manuales", async () => {
        const before = await AppDataSourceProd.getRepository(Account).findOneByOrFail({ id: cardId });
        const charge = await creditCardService.createCharge(userId, cardId, {
            type: CreditChargeType.FEE,
            amount: 1_000,
            description: "Comision manual",
        });

        const afterCreate = await AppDataSourceProd.getRepository(Account).findOneByOrFail({ id: cardId });
        expect(afterCreate.balance).toBe(before.balance - 1_000);

        await creditCardService.updateCharge(userId, cardId, charge.id, { amount: 1_500 });
        const afterUpdate = await AppDataSourceProd.getRepository(Account).findOneByOrFail({ id: cardId });
        expect(afterUpdate.balance).toBe(before.balance - 1_500);

        await creditCardService.deleteCharge(userId, cardId, charge.id);
        const afterDelete = await AppDataSourceProd.getRepository(Account).findOneByOrFail({ id: cardId });
        expect(afterDelete.balance).toBe(before.balance);
    });

    test("convierte compras confirmadas en cuotas y calcula el interes", async () => {
        const second = await createCreditExpense(20_000, "Laptop Store");
        const third = await createCreditExpense(30_000, "Online Store");
        await creditCardService.confirmTransaction(userId, second.id, {});
        await creditCardService.confirmTransaction(userId, third.id, {});

        const preview = await creditCardService.previewInstallmentPlan(userId, cardId, {
            transactionIds: [second.id, third.id],
            installments: 6,
            tea: 24,
        });
        expect(preview.principal).toBe(500);
        expect(preview.installments).toHaveLength(6);
        expect(preview.totalInterest).toBeGreaterThan(0);

        const plan = await creditCardService.createInstallmentPlan(userId, cardId, {
            transactionIds: [second.id, third.id],
            installments: 6,
            tea: 24,
        });

        expect(plan.principal).toBe(500);
        expect(plan.installmentsCount).toBe(6);
        expect(plan.installments).toHaveLength(6);
        expect(plan.totalInterest).toBeGreaterThan(0);
        expect(plan.installments.reduce((sum, row) => sum + row.principal, 0)).toBe(500);

        const firstInstallment = await AppDataSourceProd.getRepository(CreditInstallment).findOneByOrFail({
            plan: { id: plan.id },
            number: 1,
        });
        firstInstallment.closingDate = today.format("YYYY-MM-DD");
        await AppDataSourceProd.getRepository(CreditInstallment).save(firstInstallment);

        const summary = await creditCardService.getSummary(cardId, userId);
        expect(summary.plans.some((item) => item.id === plan.id)).toBe(true);
        expect(summary.eligiblePurchases.some((item) => item.id === second.id)).toBe(false);
        expect(
            summary.charges.some(
                (charge) =>
                    charge.type === CreditChargeType.INTEREST &&
                    charge.installmentId === firstInstallment.id &&
                    charge.amount > 0
            )
        ).toBe(true);
    });

    test("cancela un plan que aun no empieza a pagarse", async () => {
        const summary = await creditCardService.getSummary(cardId, userId);
        const plan = summary.plans.find((item) => item.status === "ACTIVE");
        expect(plan).toBeTruthy();

        await creditCardService.cancelInstallmentPlan(userId, cardId, plan!.id);
        const after = await creditCardService.getSummary(cardId, userId);
        const cancelled = after.plans.find((item) => item.id === plan!.id);
        expect(cancelled?.status).toBe("CANCELLED");
    });

    test("guarda, lista, descarga y elimina documentos de contrato", async () => {
        const buffer = Buffer.from("%PDF-1.4 contrato de tarjeta");
        const document = await creditCardService.uploadDocument(
            userId,
            cardId,
            {
                name: "contrato.pdf",
                type: "application/pdf",
                size: buffer.byteLength,
                data: buffer,
            },
            CreditDocumentType.CONTRACT,
            { creditLimit: 1000, tea: 24 }
        );

        const documents = await creditCardService.listDocuments(userId, cardId);
        expect(documents.some((item) => item.id === document.id)).toBe(true);

        const file = await creditCardService.getDocumentFile(userId, cardId, document.id);
        expect(file.fileName).toBe("contrato.pdf");
        expect(file.extractedData).toEqual({ creditLimit: 1000, tea: 24 });

        await creditCardService.deleteDocument(userId, cardId, document.id);
        const after = await creditCardService.listDocuments(userId, cardId);
        expect(after.some((item) => item.id === document.id)).toBe(false);
    });
});
