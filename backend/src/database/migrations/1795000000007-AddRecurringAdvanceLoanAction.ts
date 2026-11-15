import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRecurringAdvanceLoanAction1795000000007 implements MigrationInterface {
    name = 'AddRecurringAdvanceLoanAction1795000000007'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TYPE "public"."recurring_loan_action_enum" ADD VALUE IF NOT EXISTS 'ADVANCE_LOAN'`
        );
    }

    public async down(): Promise<void> {
        // PostgreSQL no permite quitar valores de un ENUM sin recrear el tipo.
    }
}
