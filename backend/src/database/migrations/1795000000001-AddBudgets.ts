import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBudgets1795000000001 implements MigrationInterface {
    name = 'AddBudgets1795000000001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "budgets" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "userId" uuid NOT NULL,
                "categoryId" uuid NOT NULL,
                "month" character varying(7) NOT NULL,
                "amount" integer NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_budgets" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_budgets_user_category_month" UNIQUE ("userId", "categoryId", "month")
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_budgets_user_month" ON "budgets" ("userId", "month") `);
        await queryRunner.query(`ALTER TABLE "budgets" ADD CONSTRAINT "FK_budgets_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "budgets" ADD CONSTRAINT "FK_budgets_category" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "budgets" DROP CONSTRAINT "FK_budgets_category"`);
        await queryRunner.query(`ALTER TABLE "budgets" DROP CONSTRAINT "FK_budgets_user"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_budgets_user_month"`);
        await queryRunner.query(`DROP TABLE "budgets"`);
    }
}
