import { MigrationInterface, QueryRunner } from "typeorm";

export class AddChangeCredentialCodeTypes1793756367022 implements MigrationInterface {
    name = 'AddChangeCredentialCodeTypes1793756367022'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."Type_Code" ADD VALUE IF NOT EXISTS 'CHANGE_EMAIL'`);
        await queryRunner.query(`ALTER TYPE "public"."Type_Code" ADD VALUE IF NOT EXISTS 'CHANGE_PASSWORD'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // PostgreSQL no permite eliminar valores de un enum existente
    }
}
