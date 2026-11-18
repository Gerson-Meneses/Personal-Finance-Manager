import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCreditCardLifecycle1795000000019 implements MigrationInterface {
    name = "AddCreditCardLifecycle1795000000019";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TYPE "credit_transaction_status_enum" AS ENUM ('PENDING', 'POSTED', 'REVERSED')
        `);
        await queryRunner.query(`
            CREATE TYPE "credit_charge_type_enum" AS ENUM ('INSURANCE', 'INTEREST', 'FEE', 'OTHER')
        `);
        await queryRunner.query(`
            CREATE TYPE "credit_charge_source_enum" AS ENUM ('AUTO', 'MANUAL')
        `);
        await queryRunner.query(`
            CREATE TYPE "credit_installment_plan_status_enum" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED')
        `);
        await queryRunner.query(`
            CREATE TYPE "credit_installment_status_enum" AS ENUM ('PENDING', 'PAID', 'OVERDUE', 'CANCELLED')
        `);
        await queryRunner.query(`
            CREATE TYPE "credit_document_type_enum" AS ENUM ('CONTRACT', 'STATEMENT', 'OTHER')
        `);

        await queryRunner.query(`ALTER TABLE "accounts" ADD COLUMN "tea" double precision`);
        await queryRunner.query(`ALTER TABLE "accounts" ADD COLUMN "tcea" double precision`);
        await queryRunner.query(`ALTER TABLE "accounts" ADD COLUMN "desgravamenRate" double precision`);
        await queryRunner.query(`ALTER TABLE "accounts" ADD COLUMN "desgravamenMaxAmount" integer`);
        await queryRunner.query(`ALTER TABLE "accounts" ADD COLUMN "currency" character varying(3)`);
        await queryRunner.query(`ALTER TABLE "accounts" ADD COLUMN "issuer" character varying(100)`);
        await queryRunner.query(`ALTER TABLE "accounts" ADD COLUMN "brand" character varying(30)`);
        await queryRunner.query(`ALTER TABLE "accounts" ADD COLUMN "last4" character varying(4)`);
        await queryRunner.query(`ALTER TABLE "accounts" ADD COLUMN "holderName" character varying(150)`);

        await queryRunner.query(`
            ALTER TABLE "transactions"
            ADD COLUMN "creditStatus" "credit_transaction_status_enum" NOT NULL DEFAULT 'POSTED'
        `);
        await queryRunner.query(`ALTER TABLE "transactions" ADD COLUMN "authorizedAmount" integer`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD COLUMN "expectedPostAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD COLUMN "confirmedAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD COLUMN "installmentPlanId" uuid`);
        await queryRunner.query(`
            CREATE INDEX "IDX_transactions_credit_status"
            ON "transactions" ("accountId", "creditStatus")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_transactions_installment_plan"
            ON "transactions" ("installmentPlanId")
        `);

        await queryRunner.query(`
            CREATE TABLE "credit_installment_plans" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "accountId" uuid NOT NULL,
                "userId" uuid NOT NULL,
                "tea" double precision NOT NULL DEFAULT 0,
                "principal" integer NOT NULL,
                "installmentsCount" integer NOT NULL,
                "firstDueDate" date NOT NULL,
                "totalInterest" integer NOT NULL DEFAULT 0,
                "totalAmount" integer NOT NULL DEFAULT 0,
                "status" "credit_installment_plan_status_enum" NOT NULL DEFAULT 'ACTIVE',
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_credit_installment_plans" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_credit_installment_plans_account"
            ON "credit_installment_plans" ("accountId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_credit_installment_plans_user"
            ON "credit_installment_plans" ("userId")
        `);
        await queryRunner.query(`
            ALTER TABLE "credit_installment_plans"
            ADD CONSTRAINT "FK_credit_installment_plans_account"
            FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "credit_installment_plans"
            ADD CONSTRAINT "FK_credit_installment_plans_user"
            FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            CREATE TABLE "credit_installments" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "planId" uuid NOT NULL,
                "number" integer NOT NULL,
                "closingDate" date NOT NULL,
                "dueDate" date NOT NULL,
                "principal" integer NOT NULL,
                "interest" integer NOT NULL DEFAULT 0,
                "total" integer NOT NULL,
                "status" "credit_installment_status_enum" NOT NULL DEFAULT 'PENDING',
                "paidAmount" integer NOT NULL DEFAULT 0,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_credit_installments" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_credit_installments_plan_number" UNIQUE ("planId", "number")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_credit_installments_due"
            ON "credit_installments" ("dueDate", "status")
        `);
        await queryRunner.query(`
            ALTER TABLE "credit_installments"
            ADD CONSTRAINT "FK_credit_installments_plan"
            FOREIGN KEY ("planId") REFERENCES "credit_installment_plans"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "transactions"
            ADD CONSTRAINT "FK_transactions_installment_plan"
            FOREIGN KEY ("installmentPlanId") REFERENCES "credit_installment_plans"("id") ON DELETE SET NULL ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            CREATE TABLE "credit_card_charges" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "accountId" uuid NOT NULL,
                "userId" uuid NOT NULL,
                "type" "credit_charge_type_enum" NOT NULL,
                "source" "credit_charge_source_enum" NOT NULL DEFAULT 'MANUAL',
                "rate" double precision,
                "baseAmount" integer,
                "amount" integer NOT NULL,
                "periodKey" character varying(20),
                "closingDate" date NOT NULL,
                "dueDate" date NOT NULL,
                "installmentId" uuid,
                "description" text,
                "ignored" boolean NOT NULL DEFAULT false,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_credit_card_charges" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_credit_card_charges_account"
            ON "credit_card_charges" ("accountId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_credit_card_charges_user"
            ON "credit_card_charges" ("userId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_credit_card_charges_cycle"
            ON "credit_card_charges" ("accountId", "type", "periodKey")
        `);
        await queryRunner.query(`
            ALTER TABLE "credit_card_charges"
            ADD CONSTRAINT "FK_credit_card_charges_account"
            FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "credit_card_charges"
            ADD CONSTRAINT "FK_credit_card_charges_user"
            FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "credit_card_charges"
            ADD CONSTRAINT "FK_credit_card_charges_installment"
            FOREIGN KEY ("installmentId") REFERENCES "credit_installments"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            CREATE TABLE "credit_card_documents" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "accountId" uuid NOT NULL,
                "userId" uuid NOT NULL,
                "fileName" character varying(255) NOT NULL,
                "mimeType" character varying(120) NOT NULL,
                "size" integer NOT NULL,
                "data" bytea NOT NULL,
                "type" "credit_document_type_enum" NOT NULL DEFAULT 'CONTRACT',
                "extractedData" jsonb,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_credit_card_documents" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_credit_card_documents_account"
            ON "credit_card_documents" ("accountId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_credit_card_documents_user"
            ON "credit_card_documents" ("userId")
        `);
        await queryRunner.query(`
            ALTER TABLE "credit_card_documents"
            ADD CONSTRAINT "FK_credit_card_documents_account"
            FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "credit_card_documents"
            ADD CONSTRAINT "FK_credit_card_documents_user"
            FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_transactions_installment_plan"`);
        await queryRunner.query(`DROP TABLE "credit_card_documents"`);
        await queryRunner.query(`DROP TABLE "credit_card_charges"`);
        await queryRunner.query(`DROP TABLE "credit_installments"`);
        await queryRunner.query(`DROP TABLE "credit_installment_plans"`);

        await queryRunner.query(`DROP INDEX "public"."IDX_transactions_installment_plan"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_transactions_credit_status"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "installmentPlanId"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "confirmedAt"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "expectedPostAt"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "authorizedAmount"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "creditStatus"`);

        await queryRunner.query(`ALTER TABLE "accounts" DROP COLUMN "holderName"`);
        await queryRunner.query(`ALTER TABLE "accounts" DROP COLUMN "last4"`);
        await queryRunner.query(`ALTER TABLE "accounts" DROP COLUMN "brand"`);
        await queryRunner.query(`ALTER TABLE "accounts" DROP COLUMN "issuer"`);
        await queryRunner.query(`ALTER TABLE "accounts" DROP COLUMN "currency"`);
        await queryRunner.query(`ALTER TABLE "accounts" DROP COLUMN "desgravamenMaxAmount"`);
        await queryRunner.query(`ALTER TABLE "accounts" DROP COLUMN "desgravamenRate"`);
        await queryRunner.query(`ALTER TABLE "accounts" DROP COLUMN "tcea"`);
        await queryRunner.query(`ALTER TABLE "accounts" DROP COLUMN "tea"`);

        await queryRunner.query(`DROP TYPE "credit_document_type_enum"`);
        await queryRunner.query(`DROP TYPE "credit_installment_status_enum"`);
        await queryRunner.query(`DROP TYPE "credit_installment_plan_status_enum"`);
        await queryRunner.query(`DROP TYPE "credit_charge_source_enum"`);
        await queryRunner.query(`DROP TYPE "credit_charge_type_enum"`);
        await queryRunner.query(`DROP TYPE "credit_transaction_status_enum"`);
    }
}
