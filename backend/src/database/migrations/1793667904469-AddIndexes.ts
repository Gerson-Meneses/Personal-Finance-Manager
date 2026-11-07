import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIndexes1793667904469 implements MigrationInterface {
    name = 'AddIndexes1793667904469'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE INDEX "IDX_transactions_category" ON "transactions" ("categoryId") `);
        await queryRunner.query(`CREATE INDEX "IDX_transactions_related_account" ON "transactions" ("relatedAccountId") `);
        await queryRunner.query(`CREATE INDEX "IDX_transactions_account" ON "transactions" ("accountId") `);
        await queryRunner.query(`CREATE INDEX "IDX_transactions_user_createdAt" ON "transactions" ("userId", "createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_transactions_user_date" ON "transactions" ("userId", "date") `);
        await queryRunner.query(`CREATE INDEX "IDX_reccurent_transactions_user" ON "reccurent_transactions" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_accounts_user" ON "accounts" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_categories_user" ON "categories" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_loans_user" ON "loans" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_codes_user_type" ON "codes" ("userId", "type") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_codes_user_type"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_loans_user"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_categories_user"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_accounts_user"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_reccurent_transactions_user"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_transactions_user_date"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_transactions_user_createdAt"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_transactions_account"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_transactions_related_account"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_transactions_category"`);
    }

}
