import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCreditTrackingStart1795000000020 implements MigrationInterface {
    name = "AddCreditTrackingStart1795000000020";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "accounts"
            ADD COLUMN "creditTrackingStartedAt" TIMESTAMP DEFAULT now()
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "accounts" DROP COLUMN "creditTrackingStartedAt"`);
    }
}
