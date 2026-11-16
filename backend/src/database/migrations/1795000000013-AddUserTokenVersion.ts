import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserTokenVersion1795000000013 implements MigrationInterface {
    name = 'AddUserTokenVersion1795000000013'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "tokenVersion" integer NOT NULL DEFAULT 0`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "tokenVersion"`);
    }
}
