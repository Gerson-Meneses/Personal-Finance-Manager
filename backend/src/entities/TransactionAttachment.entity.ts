import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    ManyToOne,
    PrimaryGeneratedColumn,
} from "typeorm";
import type { Transaction } from "./Transaction.entity";
import type { User } from "./User.entity";

@Entity({ name: "transaction_attachments" })
@Index("IDX_transaction_attachments_transaction", ["transaction"])
@Index("IDX_transaction_attachments_user", ["user"])
export class TransactionAttachment {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "varchar", length: 255, nullable: false })
    fileName: string;

    @Column({ type: "varchar", length: 120, nullable: false })
    mimeType: string;

    /** Tamaño en bytes. */
    @Column({ type: "integer", nullable: false })
    size: number;

    @Column({ type: "bytea", nullable: false })
    data: Buffer;

    @ManyToOne("Transaction", "attachments", { nullable: false, onDelete: "CASCADE" })
    transaction: Transaction;

    @ManyToOne("User", "attachments", { nullable: false, onDelete: "CASCADE" })
    user: User;

    @CreateDateColumn({ type: "timestamp" })
    createdAt: Date;
}
