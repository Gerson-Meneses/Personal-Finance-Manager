import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinTable,
    ManyToMany,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";
import { Tag } from "./Tag.entity";
import type { Transaction } from "./Transaction.entity";
import type { Category } from "./Category.entity";

@Entity({ name: "transaction_splits" })
@Index("IDX_transaction_splits_transaction", ["transaction"])
@Index("IDX_transaction_splits_category", ["category"])
export class TransactionSplit {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    /** Monto en centavos. */
    @Column({ type: "integer", nullable: false })
    amount: number;

    @Column({ type: "varchar", length: 255, nullable: true })
    description?: string | null;

    @ManyToOne("Transaction", "splits", { nullable: false, onDelete: "CASCADE" })
    transaction: Transaction;

    @ManyToOne("Category", { nullable: false, onDelete: "RESTRICT" })
    category: Category;

    @ManyToMany(() => Tag, (tag) => tag.splits)
    @JoinTable({
        name: "transaction_split_tags",
        joinColumn: { name: "splitId", referencedColumnName: "id" },
        inverseJoinColumn: { name: "tagId", referencedColumnName: "id" },
    })
    tags: Tag[];

    @CreateDateColumn({ type: "timestamp" })
    createdAt: Date;

    @UpdateDateColumn({ type: "timestamp" })
    updatedAt: Date;
}
