import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRecurringSuggestionDismissals1795000000012 implements MigrationInterface {
    name = 'AddRecurringSuggestionDismissals1795000000012'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "recurring_suggestion_dismissals" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "userId" uuid NOT NULL,
                "suggestionId" character varying(200) NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_recurring_suggestion_dismissals" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_recurring_suggestion_dismissal" UNIQUE ("userId", "suggestionId")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_recurring_suggestion_dismissals_user"
            ON "recurring_suggestion_dismissals" ("userId")
        `);
        await queryRunner.query(`
            ALTER TABLE "recurring_suggestion_dismissals"
            ADD CONSTRAINT "FK_recurring_suggestion_dismissals_user"
            FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "recurring_suggestion_dismissals" DROP CONSTRAINT "FK_recurring_suggestion_dismissals_user"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_recurring_suggestion_dismissals_user"`);
        await queryRunner.query(`DROP TABLE "recurring_suggestion_dismissals"`);
    }
}
