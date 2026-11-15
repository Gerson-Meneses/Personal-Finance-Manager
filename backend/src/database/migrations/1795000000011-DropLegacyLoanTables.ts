import { MigrationInterface, QueryRunner } from "typeorm";

export class DropLegacyLoanTables1795000000011 implements MigrationInterface {
    name = 'DropLegacyLoanTables1795000000011'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT IF EXISTS "FK_edcc6976d51564d0d65cbdb437b"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN IF EXISTS "loanPaymentId"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "loan_payments"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "loan_installments"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."extra_payment_strategy"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."loan_installments_status_enum"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."extra_payment_strategy" AS ENUM('REDUCE_TERM', 'REDUCE_INSTALLMENT')`);
        await queryRunner.query(`CREATE TYPE "public"."loan_installments_status_enum" AS ENUM('PENDING', 'PAID', 'PARTIAL')`);
        await queryRunner.query(`
            CREATE TABLE "loan_installments" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "installmentNumber" integer NOT NULL,
                "dueDate" date NOT NULL,
                "totalAmount" integer NOT NULL,
                "principalAmount" integer NOT NULL,
                "interestAmount" integer NOT NULL,
                "status" "public"."loan_installments_status_enum" NOT NULL DEFAULT 'PENDING',
                "loanId" uuid,
                CONSTRAINT "PK_d69494e8c24dd3a2131f4d10168" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "loan_payments" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "amount" integer NOT NULL,
                "strategy" "public"."extra_payment_strategy",
                "date" date NOT NULL,
                "loanId" uuid,
                "installmentId" uuid,
                CONSTRAINT "PK_db75e38243b5f2cb9e728da4d0f" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`ALTER TABLE "transactions" ADD COLUMN "loanPaymentId" uuid`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD CONSTRAINT "UQ_transactions_loanPayment" UNIQUE ("loanPaymentId")`);
        await queryRunner.query(`
            ALTER TABLE "transactions" ADD CONSTRAINT "FK_edcc6976d51564d0d65cbdb437b"
            FOREIGN KEY ("loanPaymentId") REFERENCES "loan_payments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "loan_payments" ADD CONSTRAINT "FK_c0268488cc84d23c1e5c6c1910d"
            FOREIGN KEY ("loanId") REFERENCES "loans"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "loan_payments" ADD CONSTRAINT "FK_d85c4bf2012c817996246838fcd"
            FOREIGN KEY ("installmentId") REFERENCES "loan_installments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    }
}
