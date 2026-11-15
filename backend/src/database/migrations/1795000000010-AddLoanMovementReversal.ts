import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLoanMovementReversal1795000000010 implements MigrationInterface {
    name = 'AddLoanMovementReversal1795000000010'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "loan_movements" ADD COLUMN "reversalOfMovementId" uuid`);
        await queryRunner.query(`
            ALTER TABLE "loan_movements"
            ADD CONSTRAINT "UQ_loan_movements_reversal" UNIQUE ("reversalOfMovementId")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "loan_movements" DROP CONSTRAINT "UQ_loan_movements_reversal"`);
        await queryRunner.query(`ALTER TABLE "loan_movements" DROP COLUMN "reversalOfMovementId"`);
    }
}
