import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRecurringMaxOccurrences1795000000004 implements MigrationInterface {
    name = 'AddRecurringMaxOccurrences1795000000004'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "recurring_payments" ADD COLUMN "maxOccurrences" integer`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "recurring_payments" DROP COLUMN "maxOccurrences"`);
    }
}
