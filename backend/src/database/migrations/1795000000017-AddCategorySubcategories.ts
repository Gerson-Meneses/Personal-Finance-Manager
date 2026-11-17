import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCategorySubcategories1795000000017 implements MigrationInterface {
    name = "AddCategorySubcategories1795000000017";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "categories"
            ADD COLUMN "parentCategoryId" uuid
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_categories_parent" ON "categories" ("parentCategoryId")
        `);
        await queryRunner.query(`
            ALTER TABLE "categories"
            ADD CONSTRAINT "FK_categories_parent"
            FOREIGN KEY ("parentCategoryId") REFERENCES "categories"("id")
            ON DELETE SET NULL ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "categories" DROP CONSTRAINT "FK_categories_parent"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_categories_parent"`);
        await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN "parentCategoryId"`);
    }
}
