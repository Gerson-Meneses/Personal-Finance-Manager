import { MigrationInterface, QueryRunner } from "typeorm";

export class DropTransactionMerchantRuc1795000000022 implements MigrationInterface {
    name = "DropTransactionMerchantRuc1795000000022";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN IF EXISTS "merchantRuc"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transactions" ADD COLUMN "merchantRuc" character varying(11)`);
    }
}
