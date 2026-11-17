import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";
import { BankLineStatus, TypeTransaction } from "../utils/Enums";
import type { Account } from "./Account.entity";
import type { Transaction } from "./Transaction.entity";
import type { User } from "./User.entity";

@Entity({ name: "bank_statement_lines" })
@Index("IDX_bank_statement_lines_user_status_date", ["userId", "status", "date"])
@Index("IDX_bank_statement_lines_account_status_date", ["accountId", "status", "date"])
@Index("UQ_bank_statement_lines_fingerprint", ["accountId", "fingerprint"], { unique: true })
export class BankStatementLine {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @ManyToOne("User", { nullable: false, onDelete: "CASCADE" })
    @JoinColumn({ name: "userId" })
    user: User;

    @Column({ type: "uuid" })
    userId: string;

    @ManyToOne("Account", { nullable: false, onDelete: "CASCADE" })
    @JoinColumn({ name: "accountId" })
    account: Account;

    @Column({ type: "uuid" })
    accountId: string;

    @Column({ type: "date" })
    date: string;

    @Column({ type: "varchar", length: 255 })
    description: string;

    /** Monto en centavos, siempre positivo. El signo vive en `type`. */
    @Column({ type: "integer" })
    amount: number;

    @Column({
        type: "enum",
        enum: TypeTransaction,
        enumName: "bank_line_type_enum",
    })
    type: TypeTransaction;

    @Column({ type: "varchar", length: 120, nullable: true })
    reference: string | null;

    /** Saldo de la cuenta tras el movimiento, en centavos. */
    @Column({ type: "integer", nullable: true })
    balanceAfter: number | null;

    @Column({ type: "varchar", length: 64 })
    fingerprint: string;

    @Column({
        type: "enum",
        enum: BankLineStatus,
        enumName: "bank_line_status_enum",
        default: BankLineStatus.PENDING,
    })
    status: BankLineStatus;

    @Column({ type: "uuid", nullable: true })
    transactionId: string | null;

    @OneToOne("Transaction", { nullable: true, onDelete: "SET NULL" })
    @JoinColumn({ name: "transactionId" })
    transaction: Transaction | null;

    @Column({ type: "uuid" })
    importBatchId: string;

    @Column({ type: "timestamp", nullable: true })
    matchedAt: Date | null;

    @CreateDateColumn({ type: "timestamp" })
    createdAt: Date;

    @UpdateDateColumn({ type: "timestamp" })
    updatedAt: Date;
}
