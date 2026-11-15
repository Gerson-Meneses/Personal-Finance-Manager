import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDebtInstallmentNotifications1795000000009 implements MigrationInterface {
    name = 'AddDebtInstallmentNotifications1795000000009'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payment_notifications" ALTER COLUMN "occurrenceId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "payment_notifications" ADD COLUMN "installmentId" uuid`);
        await queryRunner.query(`
            ALTER TABLE "payment_notifications"
            ADD CONSTRAINT "UQ_payment_notifications_installment" UNIQUE ("installmentId")
        `);
        await queryRunner.query(`
            ALTER TABLE "payment_notifications"
            ADD CONSTRAINT "FK_payment_notifications_installment"
            FOREIGN KEY ("installmentId") REFERENCES "debt_installments"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payment_notifications" DROP CONSTRAINT "FK_payment_notifications_installment"`);
        await queryRunner.query(`ALTER TABLE "payment_notifications" DROP CONSTRAINT "UQ_payment_notifications_installment"`);
        await queryRunner.query(`ALTER TABLE "payment_notifications" DROP COLUMN "installmentId"`);
        await queryRunner.query(`ALTER TABLE "payment_notifications" ALTER COLUMN "occurrenceId" SET NOT NULL`);
    }
}
