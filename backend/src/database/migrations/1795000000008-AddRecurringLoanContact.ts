import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRecurringLoanContact1795000000008 implements MigrationInterface {
    name = 'AddRecurringLoanContact1795000000008'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "recurring_payments" ADD COLUMN "loanContactId" uuid`);
        await queryRunner.query(`
            UPDATE "recurring_payments" rp
            SET "loanContactId" = c."id"
            FROM "contacts" c
            WHERE c."userId" = rp."userId"
              AND rp."loanCounterparty" IS NOT NULL
              AND c."normalizedName" = upper(
                  translate(
                      trim(regexp_replace(rp."loanCounterparty", '\\s+', ' ', 'g')),
                      'áéíóúÁÉÍÓÚñÑ',
                      'AEIOUAEIOUNN'
                  )
              )
        `);
        await queryRunner.query(`
            ALTER TABLE "recurring_payments"
            ADD CONSTRAINT "FK_recurring_payments_loan_contact"
            FOREIGN KEY ("loanContactId") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "recurring_payments" DROP CONSTRAINT "FK_recurring_payments_loan_contact"`);
        await queryRunner.query(`ALTER TABLE "recurring_payments" DROP COLUMN "loanContactId"`);
    }
}
