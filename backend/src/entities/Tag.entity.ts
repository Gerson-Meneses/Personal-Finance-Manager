import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    ManyToMany,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";
import type { User } from "./User.entity";
import type { Transaction } from "./Transaction.entity";
import type { TransactionSplit } from "./TransactionSplit.entity";

@Entity({ name: "tags" })
@Index("IDX_tags_user", ["user"])
@Index("UQ_tags_user_name", ["user", "name"], { unique: true })
export class Tag {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "varchar", length: 50, nullable: false })
    name: string;

    @Column({ type: "varchar", length: 9, default: "#64748b" })
    color: string;

    @ManyToOne("User", "tags", { nullable: false, onDelete: "CASCADE" })
    user: User;

    @ManyToMany("Transaction", "tags")
    transactions: Transaction[];

    @ManyToMany("TransactionSplit", "tags")
    splits: TransactionSplit[];

    @CreateDateColumn({ type: "timestamp" })
    createdAt: Date;

    @UpdateDateColumn({ type: "timestamp" })
    updatedAt: Date;
}
