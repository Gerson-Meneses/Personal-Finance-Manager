import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTransactionItemsAndMerchant1795000000018 implements MigrationInterface {
    name = "AddTransactionItemsAndMerchant1795000000018";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transactions" ADD COLUMN "merchantName" character varying(150)`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD COLUMN "merchantAddress" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD COLUMN "merchantRuc" character varying(11)`);

        await queryRunner.query(`
            CREATE TABLE "transaction_items" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(255) NOT NULL,
                "normalizedName" character varying(255) NOT NULL,
                "quantity" numeric(10,3) NOT NULL DEFAULT '1',
                "unitPrice" integer NOT NULL,
                "total" integer NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "transactionId" uuid NOT NULL,
                "userId" uuid NOT NULL,
                CONSTRAINT "PK_transaction_items" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_transaction_items_transaction"
            ON "transaction_items" ("transactionId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_transaction_items_user_normalized"
            ON "transaction_items" ("userId", "normalizedName")
        `);
        await queryRunner.query(`
            ALTER TABLE "transaction_items"
            ADD CONSTRAINT "FK_transaction_items_transaction"
            FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "transaction_items"
            ADD CONSTRAINT "FK_transaction_items_user"
            FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transaction_items" DROP CONSTRAINT "FK_transaction_items_user"`);
        await queryRunner.query(`ALTER TABLE "transaction_items" DROP CONSTRAINT "FK_transaction_items_transaction"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_transaction_items_user_normalized"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_transaction_items_transaction"`);
        await queryRunner.query(`DROP TABLE "transaction_items"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "merchantRuc"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "merchantAddress"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "merchantName"`);
    }
}
