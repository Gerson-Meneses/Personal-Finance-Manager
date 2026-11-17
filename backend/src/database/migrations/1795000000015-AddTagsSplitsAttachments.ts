import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTagsSplitsAttachments1795000000015 implements MigrationInterface {
    name = "AddTagsSplitsAttachments1795000000015";

    public async up(queryRunner: QueryRunner): Promise<void> {
        /* ------------------------------------------------------------------ */
        /* Etiquetas                                                           */
        /* ------------------------------------------------------------------ */
        await queryRunner.query(`
            CREATE TABLE "tags" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(50) NOT NULL,
                "color" character varying(9) NOT NULL DEFAULT '#64748b',
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "userId" uuid NOT NULL,
                CONSTRAINT "PK_tags" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "UQ_tags_user_name" ON "tags" ("userId", LOWER("name"))
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_tags_user" ON "tags" ("userId")
        `);
        await queryRunner.query(`
            ALTER TABLE "tags"
            ADD CONSTRAINT "FK_tags_user"
            FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            CREATE TABLE "transaction_tags" (
                "transactionId" uuid NOT NULL,
                "tagId" uuid NOT NULL,
                CONSTRAINT "PK_transaction_tags" PRIMARY KEY ("transactionId", "tagId")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_transaction_tags_tag" ON "transaction_tags" ("tagId")
        `);
        await queryRunner.query(`
            ALTER TABLE "transaction_tags"
            ADD CONSTRAINT "FK_transaction_tags_transaction"
            FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "transaction_tags"
            ADD CONSTRAINT "FK_transaction_tags_tag"
            FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        /* ------------------------------------------------------------------ */
        /* Divisiones de transacciones                                         */
        /* ------------------------------------------------------------------ */
        await queryRunner.query(`
            CREATE TABLE "transaction_splits" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "amount" integer NOT NULL,
                "description" character varying(255),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "transactionId" uuid NOT NULL,
                "categoryId" uuid NOT NULL,
                CONSTRAINT "PK_transaction_splits" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_transaction_splits_transaction" ON "transaction_splits" ("transactionId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_transaction_splits_category" ON "transaction_splits" ("categoryId")
        `);
        await queryRunner.query(`
            ALTER TABLE "transaction_splits"
            ADD CONSTRAINT "FK_transaction_splits_transaction"
            FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "transaction_splits"
            ADD CONSTRAINT "FK_transaction_splits_category"
            FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            CREATE TABLE "transaction_split_tags" (
                "splitId" uuid NOT NULL,
                "tagId" uuid NOT NULL,
                CONSTRAINT "PK_transaction_split_tags" PRIMARY KEY ("splitId", "tagId")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_transaction_split_tags_tag" ON "transaction_split_tags" ("tagId")
        `);
        await queryRunner.query(`
            ALTER TABLE "transaction_split_tags"
            ADD CONSTRAINT "FK_transaction_split_tags_split"
            FOREIGN KEY ("splitId") REFERENCES "transaction_splits"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "transaction_split_tags"
            ADD CONSTRAINT "FK_transaction_split_tags_tag"
            FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        /* ------------------------------------------------------------------ */
        /* Adjuntos                                                            */
        /* ------------------------------------------------------------------ */
        await queryRunner.query(`
            CREATE TABLE "transaction_attachments" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "fileName" character varying(255) NOT NULL,
                "mimeType" character varying(120) NOT NULL,
                "size" integer NOT NULL,
                "data" bytea NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "transactionId" uuid NOT NULL,
                "userId" uuid NOT NULL,
                CONSTRAINT "PK_transaction_attachments" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_transaction_attachments_transaction" ON "transaction_attachments" ("transactionId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_transaction_attachments_user" ON "transaction_attachments" ("userId")
        `);
        await queryRunner.query(`
            ALTER TABLE "transaction_attachments"
            ADD CONSTRAINT "FK_transaction_attachments_transaction"
            FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "transaction_attachments"
            ADD CONSTRAINT "FK_transaction_attachments_user"
            FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transaction_attachments" DROP CONSTRAINT "FK_transaction_attachments_user"`);
        await queryRunner.query(`ALTER TABLE "transaction_attachments" DROP CONSTRAINT "FK_transaction_attachments_transaction"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_transaction_attachments_user"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_transaction_attachments_transaction"`);
        await queryRunner.query(`DROP TABLE "transaction_attachments"`);

        await queryRunner.query(`ALTER TABLE "transaction_split_tags" DROP CONSTRAINT "FK_transaction_split_tags_tag"`);
        await queryRunner.query(`ALTER TABLE "transaction_split_tags" DROP CONSTRAINT "FK_transaction_split_tags_split"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_transaction_split_tags_tag"`);
        await queryRunner.query(`DROP TABLE "transaction_split_tags"`);

        await queryRunner.query(`ALTER TABLE "transaction_splits" DROP CONSTRAINT "FK_transaction_splits_category"`);
        await queryRunner.query(`ALTER TABLE "transaction_splits" DROP CONSTRAINT "FK_transaction_splits_transaction"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_transaction_splits_category"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_transaction_splits_transaction"`);
        await queryRunner.query(`DROP TABLE "transaction_splits"`);

        await queryRunner.query(`ALTER TABLE "transaction_tags" DROP CONSTRAINT "FK_transaction_tags_tag"`);
        await queryRunner.query(`ALTER TABLE "transaction_tags" DROP CONSTRAINT "FK_transaction_tags_transaction"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_transaction_tags_tag"`);
        await queryRunner.query(`DROP TABLE "transaction_tags"`);

        await queryRunner.query(`ALTER TABLE "tags" DROP CONSTRAINT "FK_tags_user"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_tags_user"`);
        await queryRunner.query(`DROP INDEX "public"."UQ_tags_user_name"`);
        await queryRunner.query(`DROP TABLE "tags"`);
    }
}
