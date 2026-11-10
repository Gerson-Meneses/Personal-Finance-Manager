import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRecurringPayments1795000000000 implements MigrationInterface {
    name = 'AddRecurringPayments1795000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."recurring_entry_type_enum" AS ENUM('EXPENSE', 'INCOME')`);
        await queryRunner.query(`CREATE TYPE "public"."recurring_frequency_enum" AS ENUM('MONTHLY', 'WEEKLY', 'BIWEEKLY', 'YEARLY')`);
        await queryRunner.query(`CREATE TYPE "public"."recurring_occurrence_status_enum" AS ENUM('PENDING', 'DUE', 'PAID', 'SKIPPED', 'FAILED')`);

        await queryRunner.query(`
            CREATE TABLE "recurring_payments" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(100) NOT NULL,
                "description" text,
                "type" "public"."recurring_entry_type_enum" NOT NULL,
                "amount" integer NOT NULL,
                "frequency" "public"."recurring_frequency_enum" NOT NULL,
                "intervalCount" integer NOT NULL DEFAULT '1',
                "dayOfMonth" integer,
                "dayOfWeek" integer,
                "startDate" date NOT NULL,
                "endDate" date,
                "isActive" boolean NOT NULL DEFAULT true,
                "autoDebit" boolean NOT NULL DEFAULT false,
                "userId" uuid NOT NULL,
                "accountId" uuid NOT NULL,
                "categoryId" uuid NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_recurring_payments" PRIMARY KEY ("id")
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "recurring_payment_occurrences" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "paymentId" uuid NOT NULL,
                "userId" uuid NOT NULL,
                "dueDate" date NOT NULL,
                "amount" integer NOT NULL,
                "type" "public"."recurring_entry_type_enum" NOT NULL,
                "status" "public"."recurring_occurrence_status_enum" NOT NULL DEFAULT 'PENDING',
                "accountId" uuid,
                "autoDebit" boolean NOT NULL DEFAULT false,
                "transactionId" uuid,
                "notifiedAt" TIMESTAMP,
                "executedAt" TIMESTAMP,
                "failureReason" text,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_recurring_payment_occurrences" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_recurring_occurrence_payment_date" UNIQUE ("paymentId", "dueDate")
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "payment_notifications" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "userId" uuid NOT NULL,
                "occurrenceId" uuid NOT NULL,
                "title" character varying(160) NOT NULL,
                "message" text NOT NULL,
                "readAt" TIMESTAMP,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_payment_notifications" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_payment_notifications_occurrence" UNIQUE ("occurrenceId")
            )
        `);

        await queryRunner.query(`CREATE INDEX "IDX_recurring_payments_user" ON "recurring_payments" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_recurring_payments_user_active" ON "recurring_payments" ("userId", "isActive") `);
        await queryRunner.query(`CREATE INDEX "IDX_recurring_occurrences_user_due" ON "recurring_payment_occurrences" ("userId", "dueDate") `);
        await queryRunner.query(`CREATE INDEX "IDX_recurring_occurrences_status" ON "recurring_payment_occurrences" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_payment_notifications_user_read" ON "payment_notifications" ("userId", "readAt") `);

        await queryRunner.query(`ALTER TABLE "recurring_payments" ADD CONSTRAINT "FK_recurring_payments_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "recurring_payments" ADD CONSTRAINT "FK_recurring_payments_account" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "recurring_payments" ADD CONSTRAINT "FK_recurring_payments_category" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "recurring_payment_occurrences" ADD CONSTRAINT "FK_recurring_occurrences_payment" FOREIGN KEY ("paymentId") REFERENCES "recurring_payments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "recurring_payment_occurrences" ADD CONSTRAINT "FK_recurring_occurrences_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "recurring_payment_occurrences" ADD CONSTRAINT "FK_recurring_occurrences_account" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "recurring_payment_occurrences" ADD CONSTRAINT "FK_recurring_occurrences_transaction" FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payment_notifications" ADD CONSTRAINT "FK_payment_notifications_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payment_notifications" ADD CONSTRAINT "FK_payment_notifications_occurrence" FOREIGN KEY ("occurrenceId") REFERENCES "recurring_payment_occurrences"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payment_notifications" DROP CONSTRAINT "FK_payment_notifications_occurrence"`);
        await queryRunner.query(`ALTER TABLE "payment_notifications" DROP CONSTRAINT "FK_payment_notifications_user"`);
        await queryRunner.query(`ALTER TABLE "recurring_payment_occurrences" DROP CONSTRAINT "FK_recurring_occurrences_transaction"`);
        await queryRunner.query(`ALTER TABLE "recurring_payment_occurrences" DROP CONSTRAINT "FK_recurring_occurrences_account"`);
        await queryRunner.query(`ALTER TABLE "recurring_payment_occurrences" DROP CONSTRAINT "FK_recurring_occurrences_user"`);
        await queryRunner.query(`ALTER TABLE "recurring_payment_occurrences" DROP CONSTRAINT "FK_recurring_occurrences_payment"`);
        await queryRunner.query(`ALTER TABLE "recurring_payments" DROP CONSTRAINT "FK_recurring_payments_category"`);
        await queryRunner.query(`ALTER TABLE "recurring_payments" DROP CONSTRAINT "FK_recurring_payments_account"`);
        await queryRunner.query(`ALTER TABLE "recurring_payments" DROP CONSTRAINT "FK_recurring_payments_user"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_payment_notifications_user_read"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_recurring_occurrences_status"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_recurring_occurrences_user_due"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_recurring_payments_user_active"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_recurring_payments_user"`);
        await queryRunner.query(`DROP TABLE "payment_notifications"`);
        await queryRunner.query(`DROP TABLE "recurring_payment_occurrences"`);
        await queryRunner.query(`DROP TABLE "recurring_payments"`);
        await queryRunner.query(`DROP TYPE "public"."recurring_occurrence_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."recurring_frequency_enum"`);
        await queryRunner.query(`DROP TYPE "public"."recurring_entry_type_enum"`);
    }
}
