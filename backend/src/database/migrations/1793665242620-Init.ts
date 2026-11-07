import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1793665242620 implements MigrationInterface {
    name = 'Init1793665242620'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."extra_payment_strategy" AS ENUM('REDUCE_TERM', 'REDUCE_INSTALLMENT')`);
        await queryRunner.query(`CREATE TABLE "loan_payments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "amount" integer NOT NULL, "strategy" "public"."extra_payment_strategy", "date" date NOT NULL, "loanId" uuid, "installmentId" uuid, CONSTRAINT "PK_db75e38243b5f2cb9e728da4d0f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."transactions_type_enum" AS ENUM('INCOME', 'EXPENSE', 'CREDIT_PAYMENT', 'TRANSFER')`);
        await queryRunner.query(`CREATE TABLE "transactions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(100) NOT NULL, "type" "public"."transactions_type_enum" NOT NULL, "amount" integer NOT NULL, "date" date NOT NULL, "postedAt" date, "time" TIME DEFAULT '00:00:00', "description" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "isRecurrent" boolean NOT NULL DEFAULT false, "accountId" uuid NOT NULL, "relatedAccountId" uuid, "categoryId" uuid, "userId" uuid NOT NULL, "loanId" uuid, "loanPaymentId" uuid, CONSTRAINT "REL_1781a19ed129d8ecf7ce983ccc" UNIQUE ("loanId"), CONSTRAINT "REL_edcc6976d51564d0d65cbdb437" UNIQUE ("loanPaymentId"), CONSTRAINT "PK_a219afd8dd77ed80f5a862f1db9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."reccurent_transactions_type_enum" AS ENUM('INCOME', 'EXPENSE', 'CREDIT_PAYMENT', 'TRANSFER')`);
        await queryRunner.query(`CREATE TABLE "reccurent_transactions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(100) NOT NULL, "type" "public"."reccurent_transactions_type_enum" NOT NULL, "amount" numeric(10,2) NOT NULL, "description" character varying(100), "frequency" integer NOT NULL, "frequencyCount" integer NOT NULL DEFAULT '1', "startDate" date NOT NULL, "endDate" date, "isActive" boolean NOT NULL DEFAULT true, "userId" uuid, "transactionId" uuid, "accountId" uuid NOT NULL, "categoryId" uuid NOT NULL, CONSTRAINT "PK_0f44ae4141716c3416e2a4e5666" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."accounts_type_enum" AS ENUM('DEBIT', 'CREDIT', 'CASH')`);
        await queryRunner.query(`CREATE TABLE "accounts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(100) NOT NULL, "type" "public"."accounts_type_enum" NOT NULL, "balance" integer NOT NULL, "color" character varying DEFAULT '#004f12', "icon" character varying DEFAULT 'wallet', "creditLimit" integer, "overdraft" integer, "billingCloseDay" integer, "paymentDueDay" integer, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid NOT NULL, CONSTRAINT "PK_5a7a02c20412299d198e097a8fe" PRIMARY KEY ("id")); COMMENT ON COLUMN "accounts"."balance" IS 'Balance en centavos'; COMMENT ON COLUMN "accounts"."creditLimit" IS 'Credito Limite en centavos'; COMMENT ON COLUMN "accounts"."overdraft" IS 'Porcentaje del 0 al 100'`);
        await queryRunner.query(`CREATE TYPE "public"."categories_type_enum" AS ENUM('INCOME', 'EXPENSE', 'CREDIT_PAYMENT', 'TRANSFER')`);
        await queryRunner.query(`CREATE TABLE "categories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(100) NOT NULL, "type" "public"."categories_type_enum" NOT NULL, "color" character varying(9) NOT NULL DEFAULT '#FFFFFF', "icon" character varying(500), "isBase" boolean NOT NULL DEFAULT false, "visible" boolean NOT NULL DEFAULT true, "userId" uuid NOT NULL, CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "credentials" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "password" character varying NOT NULL, CONSTRAINT "UQ_c286aa8e09ecff5cc756ee83214" UNIQUE ("email"), CONSTRAINT "PK_1e38bc43be6697cdda548ad27a6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."loan_installments_status_enum" AS ENUM('PENDING', 'PAID', 'PARTIAL')`);
        await queryRunner.query(`CREATE TABLE "loan_installments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "installmentNumber" integer NOT NULL, "dueDate" date NOT NULL, "totalAmount" integer NOT NULL, "principalAmount" integer NOT NULL, "interestAmount" integer NOT NULL, "status" "public"."loan_installments_status_enum" NOT NULL DEFAULT 'PENDING', "loanId" uuid, CONSTRAINT "PK_d69494e8c24dd3a2131f4d10168" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."loans_type_enum" AS ENUM('RECEIVED', 'GIVEN')`);
        await queryRunner.query(`CREATE TYPE "public"."loans_status_enum" AS ENUM('PENDING', 'PAID')`);
        await queryRunner.query(`CREATE TABLE "loans" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."loans_type_enum" NOT NULL, "lender" character varying(100) NOT NULL, "principalAmount" integer NOT NULL, "disbursementAmount" integer, "extraCost" integer, "tea" integer, "termInMonths" integer, "installmentAmount" integer, "status" "public"."loans_status_enum" NOT NULL DEFAULT 'PENDING', "startDate" date NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid NOT NULL, "transactionReferenceId" uuid, CONSTRAINT "REL_7cc39f1830884a2c3100cf68fe" UNIQUE ("transactionReferenceId"), CONSTRAINT "PK_5c6942c1e13e4de135c5203ee61" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."Type_Code" AS ENUM('VERIFY_ACCOUNT', 'RESET_PASSWORD')`);
        await queryRunner.query(`CREATE TABLE "codes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "hash_code" character varying NOT NULL, "attemps" integer NOT NULL DEFAULT '0', "expired_at" TIMESTAMP NOT NULL, "used" boolean NOT NULL DEFAULT false, "ip_validation_address" character varying, "ip_address" character varying, "type" "public"."Type_Code" NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid, CONSTRAINT "PK_9b85c624e2d705f4e8a9b64dbf4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "birthDate" TIMESTAMP NOT NULL, "phone" integer NOT NULL, "country" character varying, "isAdmin" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "is_verified" boolean NOT NULL DEFAULT false, "credentialId" uuid, CONSTRAINT "UQ_a000cca60bcf04454e727699490" UNIQUE ("phone"), CONSTRAINT "REL_d6d50143a16c49c49bf467ae54" UNIQUE ("credentialId"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "loan_payments" ADD CONSTRAINT "FK_c0268488cc84d23c1e5c6c1910d" FOREIGN KEY ("loanId") REFERENCES "loans"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "loan_payments" ADD CONSTRAINT "FK_d85c4bf2012c817996246838fcd" FOREIGN KEY ("installmentId") REFERENCES "loan_installments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD CONSTRAINT "FK_26d8aec71ae9efbe468043cd2b9" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD CONSTRAINT "FK_7bffc399687cd43d2643e62525c" FOREIGN KEY ("relatedAccountId") REFERENCES "accounts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD CONSTRAINT "FK_86e965e74f9cc66149cf6c90f64" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD CONSTRAINT "FK_6bb58f2b6e30cb51a6504599f41" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD CONSTRAINT "FK_1781a19ed129d8ecf7ce983ccc9" FOREIGN KEY ("loanId") REFERENCES "loans"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD CONSTRAINT "FK_edcc6976d51564d0d65cbdb437b" FOREIGN KEY ("loanPaymentId") REFERENCES "loan_payments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reccurent_transactions" ADD CONSTRAINT "FK_f3f2b95920ce1af59bb82ef85ae" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reccurent_transactions" ADD CONSTRAINT "FK_224ffa119ff8819c38f7bb85add" FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reccurent_transactions" ADD CONSTRAINT "FK_e0c31c3cc006387ab08e760c72e" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reccurent_transactions" ADD CONSTRAINT "FK_67a1b6ba471c59d1de9d16fddb5" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "accounts" ADD CONSTRAINT "FK_3aa23c0a6d107393e8b40e3e2a6" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "categories" ADD CONSTRAINT "FK_13e8b2a21988bec6fdcbb1fa741" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "loan_installments" ADD CONSTRAINT "FK_d5e31e586cc96ce27d00831f12d" FOREIGN KEY ("loanId") REFERENCES "loans"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "loans" ADD CONSTRAINT "FK_4c2ab4e556520045a2285916d45" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "loans" ADD CONSTRAINT "FK_7cc39f1830884a2c3100cf68fed" FOREIGN KEY ("transactionReferenceId") REFERENCES "transactions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "codes" ADD CONSTRAINT "FK_58c3fb433b31f3cbb6b62c2b625" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_d6d50143a16c49c49bf467ae541" FOREIGN KEY ("credentialId") REFERENCES "credentials"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_d6d50143a16c49c49bf467ae541"`);
        await queryRunner.query(`ALTER TABLE "codes" DROP CONSTRAINT "FK_58c3fb433b31f3cbb6b62c2b625"`);
        await queryRunner.query(`ALTER TABLE "loans" DROP CONSTRAINT "FK_7cc39f1830884a2c3100cf68fed"`);
        await queryRunner.query(`ALTER TABLE "loans" DROP CONSTRAINT "FK_4c2ab4e556520045a2285916d45"`);
        await queryRunner.query(`ALTER TABLE "loan_installments" DROP CONSTRAINT "FK_d5e31e586cc96ce27d00831f12d"`);
        await queryRunner.query(`ALTER TABLE "categories" DROP CONSTRAINT "FK_13e8b2a21988bec6fdcbb1fa741"`);
        await queryRunner.query(`ALTER TABLE "accounts" DROP CONSTRAINT "FK_3aa23c0a6d107393e8b40e3e2a6"`);
        await queryRunner.query(`ALTER TABLE "reccurent_transactions" DROP CONSTRAINT "FK_67a1b6ba471c59d1de9d16fddb5"`);
        await queryRunner.query(`ALTER TABLE "reccurent_transactions" DROP CONSTRAINT "FK_e0c31c3cc006387ab08e760c72e"`);
        await queryRunner.query(`ALTER TABLE "reccurent_transactions" DROP CONSTRAINT "FK_224ffa119ff8819c38f7bb85add"`);
        await queryRunner.query(`ALTER TABLE "reccurent_transactions" DROP CONSTRAINT "FK_f3f2b95920ce1af59bb82ef85ae"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_edcc6976d51564d0d65cbdb437b"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_1781a19ed129d8ecf7ce983ccc9"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_6bb58f2b6e30cb51a6504599f41"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_86e965e74f9cc66149cf6c90f64"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_7bffc399687cd43d2643e62525c"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_26d8aec71ae9efbe468043cd2b9"`);
        await queryRunner.query(`ALTER TABLE "loan_payments" DROP CONSTRAINT "FK_d85c4bf2012c817996246838fcd"`);
        await queryRunner.query(`ALTER TABLE "loan_payments" DROP CONSTRAINT "FK_c0268488cc84d23c1e5c6c1910d"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "codes"`);
        await queryRunner.query(`DROP TYPE "public"."Type_Code"`);
        await queryRunner.query(`DROP TABLE "loans"`);
        await queryRunner.query(`DROP TYPE "public"."loans_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."loans_type_enum"`);
        await queryRunner.query(`DROP TABLE "loan_installments"`);
        await queryRunner.query(`DROP TYPE "public"."loan_installments_status_enum"`);
        await queryRunner.query(`DROP TABLE "credentials"`);
        await queryRunner.query(`DROP TABLE "categories"`);
        await queryRunner.query(`DROP TYPE "public"."categories_type_enum"`);
        await queryRunner.query(`DROP TABLE "accounts"`);
        await queryRunner.query(`DROP TYPE "public"."accounts_type_enum"`);
        await queryRunner.query(`DROP TABLE "reccurent_transactions"`);
        await queryRunner.query(`DROP TYPE "public"."reccurent_transactions_type_enum"`);
        await queryRunner.query(`DROP TABLE "transactions"`);
        await queryRunner.query(`DROP TYPE "public"."transactions_type_enum"`);
        await queryRunner.query(`DROP TABLE "loan_payments"`);
        await queryRunner.query(`DROP TYPE "public"."extra_payment_strategy"`);
    }

}
