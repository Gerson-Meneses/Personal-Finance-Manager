import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNotificationAlerts1795000000016 implements MigrationInterface {
    name = 'AddNotificationAlerts1795000000016'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payment_notifications" ADD COLUMN "kind" character varying(30) NOT NULL DEFAULT 'PAYMENT'`);
        await queryRunner.query(`ALTER TABLE "payment_notifications" ADD COLUMN "dedupeKey" character varying(200)`);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "UQ_payment_notifications_dedupe"
            ON "payment_notifications" ("userId", "dedupeKey")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."UQ_payment_notifications_dedupe"`);
        await queryRunner.query(`ALTER TABLE "payment_notifications" DROP COLUMN "dedupeKey"`);
        await queryRunner.query(`ALTER TABLE "payment_notifications" DROP COLUMN "kind"`);
    }
}
