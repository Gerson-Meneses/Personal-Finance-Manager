import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDeleteAccountCodeType1793762564915 implements MigrationInterface {
    name = 'AddDeleteAccountCodeType1793762564915'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."Type_Code" ADD VALUE IF NOT EXISTS 'DELETE_ACCOUNT'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // PostgreSQL no permite eliminar valores de un enum existente
    }
}
