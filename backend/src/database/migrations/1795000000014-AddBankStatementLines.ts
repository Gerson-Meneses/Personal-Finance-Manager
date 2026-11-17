import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBankStatementLines1795000000014 implements MigrationInterface {
    name = "AddBankStatementLines1795000000014";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DO $$ BEGIN
                CREATE TYPE "bank_line_type_enum" AS ENUM ('INCOME', 'EXPENSE', 'CREDIT_PAYMENT', 'TRANSFER');
            EXCEPTION WHEN duplicate_object THEN null;
            END $$
        `);
        await queryRunner.query(`
            DO $$ BEGIN
                CREATE TYPE "bank_line_status_enum" AS ENUM ('PENDING', 'MATCHED', 'IMPORTED', 'IGNORED');
            EXCEPTION WHEN duplicate_object THEN null;
            END $$
        `);
        await queryRunner.query(`
            CREATE TABLE "bank_statement_lines" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "userId" uuid NOT NULL,
                "accountId" uuid NOT NULL,
                "date" date NOT NULL,
                "description" character varying(255) NOT NULL,
                "amount" integer NOT NULL,
                "type" "bank_line_type_enum" NOT NULL,
                "reference" character varying(120),
                "balanceAfter" integer,
                "fingerprint" character varying(64) NOT NULL,
                "status" "bank_line_status_enum" NOT NULL DEFAULT 'PENDING',
                "transactionId" uuid,
                "importBatchId" uuid NOT NULL,
                "matchedAt" TIMESTAMP,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_bank_statement_lines" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "UQ_bank_statement_lines_fingerprint"
            ON "bank_statement_lines" ("accountId", "fingerprint")
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "UQ_bank_statement_lines_transaction"
            ON "bank_statement_lines" ("transactionId")
            WHERE "transactionId" IS NOT NULL
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_bank_statement_lines_user_status_date"
            ON "bank_statement_lines" ("userId", "status", "date")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_bank_statement_lines_account_status_date"
            ON "bank_statement_lines" ("accountId", "status", "date")
        `);
        await queryRunner.query(`
            ALTER TABLE "bank_statement_lines"
            ADD CONSTRAINT "FK_bank_statement_lines_user"
            FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "bank_statement_lines"
            ADD CONSTRAINT "FK_bank_statement_lines_account"
            FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "bank_statement_lines"
            ADD CONSTRAINT "FK_bank_statement_lines_transaction"
            FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE SET NULL ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "bank_statement_lines" DROP CONSTRAINT "FK_bank_statement_lines_transaction"`);
        await queryRunner.query(`ALTER TABLE "bank_statement_lines" DROP CONSTRAINT "FK_bank_statement_lines_account"`);
        await queryRunner.query(`ALTER TABLE "bank_statement_lines" DROP CONSTRAINT "FK_bank_statement_lines_user"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bank_statement_lines_account_status_date"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bank_statement_lines_user_status_date"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_bank_statement_lines_transaction"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_bank_statement_lines_fingerprint"`);
        await queryRunner.query(`DROP TABLE "bank_statement_lines"`);
        await queryRunner.query(`DROP TYPE "bank_line_status_enum"`);
        await queryRunner.query(`DROP TYPE "bank_line_type_enum"`);
    }
}
