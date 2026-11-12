import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFifteenDaysFrequency1795000000005 implements MigrationInterface {
    name = 'AddFifteenDaysFrequency1795000000005'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TYPE "public"."recurring_frequency_enum" ADD VALUE IF NOT EXISTS 'FIFTEEN_DAYS'`
        );
    }

    public async down(): Promise<void> {
        // PostgreSQL no permite eliminar valores de un ENUM sin recrear el tipo.
    }
}
