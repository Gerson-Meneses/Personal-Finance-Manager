import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRecurringLoanLinks1795000000003 implements MigrationInterface {
    name = 'AddRecurringLoanLinks1795000000003'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DO $$ BEGIN
                CREATE TYPE "public"."recurring_loan_action_enum" AS ENUM('NONE', 'PAY_LOAN', 'GIVE_LOAN', 'RECEIVE_LOAN');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);

        await queryRunner.query(`
            ALTER TABLE "recurring_payments"
            ADD COLUMN "loanAction" "public"."recurring_loan_action_enum" NOT NULL DEFAULT 'NONE'
        `);
        await queryRunner.query(`ALTER TABLE "recurring_payments" ADD COLUMN "loanId" uuid`);
        await queryRunner.query(`ALTER TABLE "recurring_payments" ADD COLUMN "loanCounterparty" character varying(100)`);
        await queryRunner.query(`
            ALTER TABLE "recurring_payments"
            ADD CONSTRAINT "FK_recurring_payments_loan"
            FOREIGN KEY ("loanId") REFERENCES "loans"("id") ON DELETE SET NULL ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "recurring_payments" DROP CONSTRAINT "FK_recurring_payments_loan"`);
        await queryRunner.query(`ALTER TABLE "recurring_payments" DROP COLUMN "loanCounterparty"`);
        await queryRunner.query(`ALTER TABLE "recurring_payments" DROP COLUMN "loanId"`);
        await queryRunner.query(`ALTER TABLE "recurring_payments" DROP COLUMN "loanAction"`);
        await queryRunner.query(`DROP TYPE "public"."recurring_loan_action_enum"`);
    }
}
