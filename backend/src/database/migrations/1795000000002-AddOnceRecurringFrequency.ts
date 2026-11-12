import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOnceRecurringFrequency1795000000002 implements MigrationInterface {
    name = 'AddOnceRecurringFrequency1795000000002'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."recurring_frequency_enum" ADD VALUE IF NOT EXISTS 'ONCE'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // PostgreSQL no permite eliminar un valor de un ENUM sin recrear el tipo.
        // Se mantiene ONCE para evitar una migración destructiva.
    }
}
