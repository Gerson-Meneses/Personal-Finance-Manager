import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUsersDeletedAt1793762564914 implements MigrationInterface {
    name = 'AddUsersDeletedAt1793762564914'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "deletedAt" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "deletedAt"`);
    }
}
