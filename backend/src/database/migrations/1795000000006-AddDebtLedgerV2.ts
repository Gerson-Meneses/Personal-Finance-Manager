import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDebtLedgerV21795000000006 implements MigrationInterface {
    name = 'AddDebtLedgerV21795000000006'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."loans_status_enum" ADD VALUE IF NOT EXISTS 'PARTIALLY_PAID'`);
        await queryRunner.query(`ALTER TYPE "public"."loans_status_enum" ADD VALUE IF NOT EXISTS 'OVERDUE'`);
        await queryRunner.query(`ALTER TYPE "public"."loans_status_enum" ADD VALUE IF NOT EXISTS 'CANCELLED'`);

        await queryRunner.query(`CREATE TYPE "public"."loan_movement_type_enum" AS ENUM('ADVANCE', 'REPAYMENT', 'FORGIVENESS', 'ADJUSTMENT', 'INTEREST')`);
        await queryRunner.query(`CREATE TYPE "public"."loan_plan_status_enum" AS ENUM('ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED')`);
        await queryRunner.query(`CREATE TYPE "public"."debt_installment_status_enum" AS ENUM('PENDING', 'PARTIAL', 'PAID', 'OVERDUE', 'CANCELLED')`);
        await queryRunner.query(`CREATE TYPE "public"."transaction_reporting_impact_enum" AS ENUM('REPORTABLE', 'CASHFLOW_ONLY')`);

        await queryRunner.query(`
            CREATE TABLE "contacts" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "userId" uuid NOT NULL,
                "name" character varying(100) NOT NULL,
                "normalizedName" character varying(100) NOT NULL,
                "notes" text,
                "archived" boolean NOT NULL DEFAULT false,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_contacts" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_contacts_user" ON "contacts" ("userId")`);
        await queryRunner.query(`CREATE INDEX "IDX_contacts_user_normalized" ON "contacts" ("userId", "normalizedName")`);

        await queryRunner.query(`ALTER TABLE "loans" ADD COLUMN "contactId" uuid`);
        await queryRunner.query(`ALTER TABLE "loans" ADD COLUMN "notes" character varying(150)`);
        await queryRunner.query(`ALTER TABLE "loans" ADD COLUMN "cancelledAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "loans" ADD COLUMN "cancelReason" text`);

        await queryRunner.query(`
            CREATE TABLE "loan_movements" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "loanId" uuid NOT NULL,
                "type" "public"."loan_movement_type_enum" NOT NULL,
                "amount" integer NOT NULL,
                "date" date NOT NULL,
                "time" TIME,
                "note" text,
                "metadata" jsonb,
                "transactionId" uuid,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_loan_movements" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_loan_movements_transaction" UNIQUE ("transactionId")
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_loan_movements_loan_date" ON "loan_movements" ("loanId", "date")`);

        await queryRunner.query(`
            CREATE TABLE "loan_plans" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "userId" uuid NOT NULL,
                "contactId" uuid NOT NULL,
                "loanId" uuid,
                "direction" "public"."loans_type_enum" NOT NULL,
                "amountPerInstallment" integer NOT NULL,
                "frequency" "public"."recurring_frequency_enum" NOT NULL DEFAULT 'FIFTEEN_DAYS',
                "intervalCount" integer NOT NULL DEFAULT 1,
                "startDate" date NOT NULL,
                "installmentCount" integer NOT NULL,
                "status" "public"."loan_plan_status_enum" NOT NULL DEFAULT 'ACTIVE',
                "notes" text,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_loan_plans" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_loan_plans_user" ON "loan_plans" ("userId", "status")`);
        await queryRunner.query(`CREATE INDEX "IDX_loan_plans_contact" ON "loan_plans" ("contactId", "status")`);

        await queryRunner.query(`
            CREATE TABLE "debt_installments" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "contactId" uuid NOT NULL,
                "loanId" uuid,
                "planId" uuid,
                "sequence" integer NOT NULL,
                "dueDate" date,
                "amountDue" integer NOT NULL,
                "principalDue" integer NOT NULL DEFAULT 0,
                "interestDue" integer NOT NULL DEFAULT 0,
                "feeDue" integer NOT NULL DEFAULT 0,
                "paidAmount" integer NOT NULL DEFAULT 0,
                "status" "public"."debt_installment_status_enum" NOT NULL DEFAULT 'PENDING',
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_debt_installments" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_debt_installments_contact_due" ON "debt_installments" ("contactId", "dueDate")`);
        await queryRunner.query(`CREATE INDEX "IDX_debt_installments_plan_sequence" ON "debt_installments" ("planId", "sequence")`);

        await queryRunner.query(`
            CREATE TABLE "loan_payment_allocations" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "movementId" uuid NOT NULL,
                "installmentId" uuid NOT NULL,
                "amount" integer NOT NULL,
                "principalAmount" integer NOT NULL DEFAULT 0,
                "interestAmount" integer NOT NULL DEFAULT 0,
                "feeAmount" integer NOT NULL DEFAULT 0,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_loan_payment_allocations" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_loan_payment_allocations_movement" ON "loan_payment_allocations" ("movementId")`);
        await queryRunner.query(`CREATE INDEX "IDX_loan_payment_allocations_installment" ON "loan_payment_allocations" ("installmentId")`);

        await queryRunner.query(`
            CREATE TABLE "audit_logs" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "userId" uuid NOT NULL,
                "entityType" character varying(50) NOT NULL,
                "entityId" uuid NOT NULL,
                "action" character varying(50) NOT NULL,
                "before" jsonb,
                "after" jsonb,
                "reason" text,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_audit_logs" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_audit_logs_user_entity" ON "audit_logs" ("userId", "entityType", "entityId")`);

        await queryRunner.query(`ALTER TABLE "transactions" ADD COLUMN "reportingImpact" "public"."transaction_reporting_impact_enum" NOT NULL DEFAULT 'REPORTABLE'`);
        await queryRunner.query(`ALTER TABLE "recurring_payment_occurrences" ADD COLUMN "executedAmount" integer`);
        await queryRunner.query(`ALTER TABLE "recurring_payment_occurrences" ADD COLUMN "executionNote" text`);

        await queryRunner.query(`
            ALTER TABLE "contacts" ADD CONSTRAINT "FK_contacts_user"
            FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "loans" ADD CONSTRAINT "FK_loans_contact"
            FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "loan_movements" ADD CONSTRAINT "FK_loan_movements_loan"
            FOREIGN KEY ("loanId") REFERENCES "loans"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "loan_movements" ADD CONSTRAINT "FK_loan_movements_transaction"
            FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE SET NULL ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "loan_plans" ADD CONSTRAINT "FK_loan_plans_user"
            FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "loan_plans" ADD CONSTRAINT "FK_loan_plans_contact"
            FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "loan_plans" ADD CONSTRAINT "FK_loan_plans_loan"
            FOREIGN KEY ("loanId") REFERENCES "loans"("id") ON DELETE SET NULL ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "debt_installments" ADD CONSTRAINT "FK_debt_installments_contact"
            FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "debt_installments" ADD CONSTRAINT "FK_debt_installments_loan"
            FOREIGN KEY ("loanId") REFERENCES "loans"("id") ON DELETE SET NULL ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "debt_installments" ADD CONSTRAINT "FK_debt_installments_plan"
            FOREIGN KEY ("planId") REFERENCES "loan_plans"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "loan_payment_allocations" ADD CONSTRAINT "FK_loan_payment_allocations_movement"
            FOREIGN KEY ("movementId") REFERENCES "loan_movements"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "loan_payment_allocations" ADD CONSTRAINT "FK_loan_payment_allocations_installment"
            FOREIGN KEY ("installmentId") REFERENCES "debt_installments"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "audit_logs" ADD CONSTRAINT "FK_audit_logs_user"
            FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            CREATE TEMP TABLE tmp_contact_names AS
            SELECT DISTINCT ON ("userId", normalized_name)
                "userId",
                lender,
                normalized_name
            FROM (
                SELECT
                    "userId",
                    lender,
                    upper(translate(trim(regexp_replace(lender, '\\s+', ' ', 'g')), 'áéíóúÁÉÍÓÚñÑ', 'AEIOUAEIOUNN')) AS normalized_name
                FROM "loans"
            ) normalized
            ORDER BY "userId", normalized_name, lender
        `);
        await queryRunner.query(`
            INSERT INTO "contacts" ("userId", "name", "normalizedName")
            SELECT "userId", lender, normalized_name FROM tmp_contact_names
        `);
        await queryRunner.query(`
            UPDATE "loans" l
            SET "contactId" = c."id"
            FROM "contacts" c
            WHERE c."userId" = l."userId"
              AND c."normalizedName" = upper(translate(trim(regexp_replace(l.lender, '\\s+', ' ', 'g')), 'áéíóúÁÉÍÓÚñÑ', 'AEIOUAEIOUNN'))
        `);
        await queryRunner.query(`DROP TABLE tmp_contact_names`);

        await queryRunner.query(`
            INSERT INTO "loan_movements" ("loanId", "type", "amount", "date", "note", "transactionId")
            SELECT
                l."id",
                'ADVANCE',
                l."principalAmount",
                l."startDate",
                'Saldo inicial migrado',
                l."transactionReferenceId"
            FROM "loans" l
        `);
        await queryRunner.query(`
            INSERT INTO "loan_movements" ("loanId", "type", "amount", "date", "note", "transactionId")
            SELECT
                lp."loanId",
                'REPAYMENT',
                lp."amount",
                lp."date",
                t."description",
                t."id"
            FROM "loan_payments" lp
            LEFT JOIN "transactions" t ON t."loanPaymentId" = lp."id"
            WHERE lp."loanId" IS NOT NULL
        `);

        await queryRunner.query(`
            UPDATE "transactions"
            SET "reportingImpact" = 'CASHFLOW_ONLY'
            WHERE "loanId" IS NOT NULL OR "loanPaymentId" IS NOT NULL
        `);
        await queryRunner.query(`
            UPDATE "recurring_payment_occurrences"
            SET "executedAmount" = "amount"
            WHERE "status" = 'PAID'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "audit_logs" DROP CONSTRAINT "FK_audit_logs_user"`);
        await queryRunner.query(`ALTER TABLE "loan_payment_allocations" DROP CONSTRAINT "FK_loan_payment_allocations_installment"`);
        await queryRunner.query(`ALTER TABLE "loan_payment_allocations" DROP CONSTRAINT "FK_loan_payment_allocations_movement"`);
        await queryRunner.query(`ALTER TABLE "debt_installments" DROP CONSTRAINT "FK_debt_installments_plan"`);
        await queryRunner.query(`ALTER TABLE "debt_installments" DROP CONSTRAINT "FK_debt_installments_loan"`);
        await queryRunner.query(`ALTER TABLE "debt_installments" DROP CONSTRAINT "FK_debt_installments_contact"`);
        await queryRunner.query(`ALTER TABLE "loan_plans" DROP CONSTRAINT "FK_loan_plans_loan"`);
        await queryRunner.query(`ALTER TABLE "loan_plans" DROP CONSTRAINT "FK_loan_plans_contact"`);
        await queryRunner.query(`ALTER TABLE "loan_plans" DROP CONSTRAINT "FK_loan_plans_user"`);
        await queryRunner.query(`ALTER TABLE "loan_movements" DROP CONSTRAINT "FK_loan_movements_transaction"`);
        await queryRunner.query(`ALTER TABLE "loan_movements" DROP CONSTRAINT "FK_loan_movements_loan"`);
        await queryRunner.query(`ALTER TABLE "loans" DROP CONSTRAINT "FK_loans_contact"`);
        await queryRunner.query(`ALTER TABLE "contacts" DROP CONSTRAINT "FK_contacts_user"`);

        await queryRunner.query(`ALTER TABLE "recurring_payment_occurrences" DROP COLUMN "executionNote"`);
        await queryRunner.query(`ALTER TABLE "recurring_payment_occurrences" DROP COLUMN "executedAmount"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "reportingImpact"`);
        await queryRunner.query(`DROP TABLE "audit_logs"`);
        await queryRunner.query(`DROP TABLE "loan_payment_allocations"`);
        await queryRunner.query(`DROP TABLE "debt_installments"`);
        await queryRunner.query(`DROP TABLE "loan_plans"`);
        await queryRunner.query(`DROP TABLE "loan_movements"`);
        await queryRunner.query(`ALTER TABLE "loans" DROP COLUMN "cancelReason"`);
        await queryRunner.query(`ALTER TABLE "loans" DROP COLUMN "cancelledAt"`);
        await queryRunner.query(`ALTER TABLE "loans" DROP COLUMN "notes"`);
        await queryRunner.query(`ALTER TABLE "loans" DROP COLUMN "contactId"`);
        await queryRunner.query(`DROP TABLE "contacts"`);
        await queryRunner.query(`DROP TYPE "public"."transaction_reporting_impact_enum"`);
        await queryRunner.query(`DROP TYPE "public"."debt_installment_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."loan_plan_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."loan_movement_type_enum"`);
    }
}
