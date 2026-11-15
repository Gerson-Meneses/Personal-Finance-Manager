import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import dayjs from "dayjs";
import { AppDataSourceProd } from "../src/database/dataBaseDev";
import { Account } from "../src/entities/Account.entity";
import { Category } from "../src/entities/Category.entity";
import { Contact } from "../src/entities/Contact.entity";
import { DebtInstallment } from "../src/entities/DebtInstallment.entity";
import { Loan } from "../src/entities/Loan.entity";
import { LoanMovement } from "../src/entities/LoanMovement.entity";
import { LoanPlan } from "../src/entities/LoanPlan.entity";
import { RecurringPayment } from "../src/entities/RecurringPayment.entity";
import { User } from "../src/entities/User.entity";
import { ContactService } from "../src/services/contactService";
import { LoanPlanService } from "../src/services/loanPlanService";
import { LoansService } from "../src/services/loansService";
import {
    DebtInstallmentStatus,
    LoanPlanStatus,
    RecurrenceFrequency,
    StatusLoan,
    TypeLoan,
    TypeTransaction,
} from "../src/utils/Enums";

const hasDatabase = Boolean(process.env.DATABASE_URL || process.env.DB_HOST);
const describeDb = hasDatabase ? describe : describe.skip;

describeDb("integración del ledger de préstamos", () => {
    let userId = "";
    let accountId = "";
    let contactId = "";
    let loanId = "";
    let planId = "";

    beforeAll(async () => {
        if (!AppDataSourceProd.isInitialized) await AppDataSourceProd.initialize();

        const suffix = Date.now().toString().slice(-8);
        const user = await AppDataSourceProd.getRepository(User).save(
            AppDataSourceProd.getRepository(User).create({
                name: "Integration Loan User",
                birthDate: new Date("1990-01-01"),
                phone: Number(`8${suffix}`),
                country: "PE",
                isAdmin: false,
                is_verified: true,
            })
        );
        userId = user.id;

        const categories = await AppDataSourceProd.getRepository(Category).save([
            AppDataSourceProd.getRepository(Category).create({
                name: "PRÉSTAMOS",
                type: TypeTransaction.EXPENSE,
                user,
            }),
            AppDataSourceProd.getRepository(Category).create({
                name: "DEVOLUCIÓN DE PRÉSTAMO",
                type: TypeTransaction.INCOME,
                user,
            }),
            AppDataSourceProd.getRepository(Category).create({
                name: "DEVOLUCIÓN DE PRÉSTAMO",
                type: TypeTransaction.EXPENSE,
                user,
            }),
        ]);

        const account = await AppDataSourceProd.getRepository(Account).save(
            AppDataSourceProd.getRepository(Account).create({
                name: "Integration Account",
                type: "DEBIT",
                balance: 1_000_000,
                color: "#38bdf8",
                icon: "wallet",
                user,
            })
        );
        accountId = account.id;

        const loans = new LoansService();
        const today = dayjs().format("YYYY-MM-DD");
        const loan = await loans.createLoan(userId as any, {
            type: TypeLoan.GIVEN,
            lender: "Integration Contact",
            date: new Date(),
            startDate: today,
            time: "10:00",
            description: "Integration loan",
            amount: 5_000,
            accountId,
        } as any);
        loanId = loan.id;
        contactId = loan.contact?.id ?? "";

        const planService = new LoanPlanService();
        const plan = await planService.createForLoan(userId as any, loanId as any, {
            amountPerInstallment: 5_000,
            installmentCount: 1,
            startDate: today,
            frequency: RecurrenceFrequency.FIFTEEN_DAYS,
            intervalCount: 1,
        } as any);
        planId = plan.id;

        expect(categories).toHaveLength(3);
        expect(contactId).not.toBe("");
    }, 30000);

    afterAll(async () => {
        if (!userId) return;
        await AppDataSourceProd.query(`UPDATE "transactions" SET "loanId" = NULL WHERE "userId" = $1`, [userId]);
        await AppDataSourceProd.query(`UPDATE "loans" SET "transactionReferenceId" = NULL WHERE "userId" = $1`, [userId]);
        await AppDataSourceProd.query(`DELETE FROM "payment_notifications" WHERE "userId" = $1`, [userId]);
        await AppDataSourceProd.query(`DELETE FROM "loan_payment_allocations" WHERE "movementId" IN (SELECT id FROM "loan_movements" WHERE "loanId" IN (SELECT id FROM "loans" WHERE "userId" = $1))`, [userId]);
        await AppDataSourceProd.query(`DELETE FROM "debt_installments" WHERE "contactId" IN (SELECT id FROM "contacts" WHERE "userId" = $1)`, [userId]);
        await AppDataSourceProd.query(`DELETE FROM "loan_plans" WHERE "userId" = $1`, [userId]);
        await AppDataSourceProd.query(`DELETE FROM "loan_movements" WHERE "loanId" IN (SELECT id FROM "loans" WHERE "userId" = $1)`, [userId]);
        await AppDataSourceProd.query(`DELETE FROM "loans" WHERE "userId" = $1`, [userId]);
        await AppDataSourceProd.query(`DELETE FROM "transactions" WHERE "userId" = $1`, [userId]);
        await AppDataSourceProd.query(`DELETE FROM "recurring_payment_occurrences" WHERE "userId" = $1`, [userId]);
        await AppDataSourceProd.query(`DELETE FROM "recurring_payments" WHERE "userId" = $1`, [userId]);
        await AppDataSourceProd.query(`DELETE FROM "audit_logs" WHERE "userId" = $1`, [userId]);
        await AppDataSourceProd.query(`DELETE FROM "contacts" WHERE "userId" = $1`, [userId]);
        await AppDataSourceProd.query(`DELETE FROM "accounts" WHERE "userId" = $1`, [userId]);
        await AppDataSourceProd.query(`DELETE FROM "categories" WHERE "userId" = $1`, [userId]);
        await AppDataSourceProd.query(`DELETE FROM "users" WHERE "id" = $1`, [userId]);
        if (AppDataSourceProd.isInitialized) await AppDataSourceProd.destroy();
    }, 30000);

    test("paga una cuota, completa el plan y revierte el pago", async () => {
        const loans = new LoansService();
        const today = dayjs().format("YYYY-MM-DD");
        const installment = await AppDataSourceProd.getRepository(DebtInstallment).findOneByOrFail({
            planId,
        });

        await loans.payInstallment(userId as any, installment.id as any, {
            amount: 5_000,
            date: today,
            accountId,
            description: "Integration payment",
        });

        const paidPlan = await AppDataSourceProd.getRepository(LoanPlan).findOneByOrFail({ id: planId });
        const paidLoan = await AppDataSourceProd.getRepository(Loan).findOneByOrFail({ id: loanId });
        const movement = await AppDataSourceProd.getRepository(LoanMovement).findOneOrFail({
            where: { loanId, type: "REPAYMENT" as any },
        });

        expect(paidPlan.status).toBe(LoanPlanStatus.COMPLETED);
        expect(paidLoan.status).toBe(StatusLoan.PAID);

        await loans.updateMovement(userId as any, loanId as any, movement.id as any, {
            note: "Integration note updated",
        });
        const editedMovement = await AppDataSourceProd.getRepository(LoanMovement).findOneByOrFail({
            id: movement.id,
        });
        expect(editedMovement.note).toBe("Integration note updated");

        await loans.reverseMovement(userId as any, loanId as any, movement.id as any, {
            reason: "Integration reversal",
        });

        const reversedPlan = await AppDataSourceProd.getRepository(LoanPlan).findOneByOrFail({ id: planId });
        const reversedLoan = await AppDataSourceProd.getRepository(Loan).findOneByOrFail({ id: loanId });
        const reversedInstallment = await AppDataSourceProd.getRepository(DebtInstallment).findOneByOrFail({
            id: installment.id,
        });

        expect(reversedPlan.status).toBe(LoanPlanStatus.ACTIVE);
        expect(reversedLoan.status).not.toBe(StatusLoan.PAID);
        expect(reversedInstallment.status).not.toBe(DebtInstallmentStatus.PAID);
    }, 30000);

    test("fusiona contactos y reasigna recurrentes", async () => {
        const target = await AppDataSourceProd.getRepository(Contact).save(
            AppDataSourceProd.getRepository(Contact).create({
                userId,
                name: "Integration Target",
                normalizedName: "INTEGRATION TARGET",
            })
        );

        const source = await AppDataSourceProd.getRepository(Contact).findOneByOrFail({ id: contactId });
        const category = await AppDataSourceProd.getRepository(Category).findOneOrFail({
            where: { name: "PRÉSTAMOS", type: TypeTransaction.EXPENSE, user: { id: userId } },
        });
        const recurring = await AppDataSourceProd.getRepository(RecurringPayment).save(
            AppDataSourceProd.getRepository(RecurringPayment).create({
                userId,
                user: { id: userId } as User,
                name: "Integration recurring",
                type: "EXPENSE",
                amount: 1_000,
                frequency: RecurrenceFrequency.MONTHLY,
                intervalCount: 1,
                dayOfMonth: 5,
                startDate: dayjs().format("YYYY-MM-DD"),
                autoDebit: false,
                accountId,
                categoryId: category.id,
                loanAction: "PAY_LOAN" as any,
                loanContactId: source.id,
                loanCounterparty: source.name,
            })
        );

        const contactService = new ContactService();
        await contactService.merge(userId as any, source.id as any, target.id as any);
        const updatedRecurring = await AppDataSourceProd.getRepository(RecurringPayment).findOneByOrFail({
            id: recurring.id,
        });

        expect(updatedRecurring.loanContactId).toBe(target.id);
        expect(updatedRecurring.loanCounterparty).toBe(target.name);
    }, 30000);
});
