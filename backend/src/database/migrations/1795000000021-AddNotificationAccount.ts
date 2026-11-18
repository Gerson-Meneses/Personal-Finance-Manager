import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNotificationAccount1795000000021 implements MigrationInterface {
    name = "AddNotificationAccount1795000000021";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payment_notifications" ADD COLUMN "accountId" uuid`);
        await queryRunner.query(`
            CREATE INDEX "IDX_payment_notifications_account"
            ON "payment_notifications" ("accountId")
        `);
        await queryRunner.query(`
            ALTER TABLE "payment_notifications"
            ADD CONSTRAINT "FK_payment_notifications_account"
            FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payment_notifications" DROP CONSTRAINT "FK_payment_notifications_account"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_payment_notifications_account"`);
        await queryRunner.query(`ALTER TABLE "payment_notifications" DROP COLUMN "accountId"`);
    }
}
