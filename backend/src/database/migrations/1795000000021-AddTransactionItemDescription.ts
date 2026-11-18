import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTransactionItemDescription1795000000021 implements MigrationInterface {
    name = "AddTransactionItemDescription1795000000021";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "transaction_items"
            ADD COLUMN "description" character varying(500)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transaction_items" DROP COLUMN "description"`);
    }
}
