import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, UpdateDateColumn, OneToMany, OneToOne, JoinColumn, Index, ManyToMany, JoinTable } from "typeorm";
import type { Account } from "./Account.entity";
import type { Category } from "./Category.entity";
import { TransactionReportingImpact, TypeTransaction } from "../utils/Enums";
import type { User } from "./User.entity";
import type { ReccurentTransaction } from "./ReccurentTransaction.entity";
import type { Loan } from "./Loan.entity";
import { Tag } from "./Tag.entity";
import { TransactionSplit } from "./TransactionSplit.entity";
import { TransactionItem } from "./TransactionItem.entity";
import type { TransactionAttachment } from "./TransactionAttachment.entity";

@Entity({
    name: 'transactions'
})
@Index('IDX_transactions_user_date', ['user', 'date'])
@Index('IDX_transactions_user_createdAt', ['user', 'createdAt'])
@Index('IDX_transactions_account', ['account'])
@Index('IDX_transactions_related_account', ['relatedAccount'])
@Index('IDX_transactions_category', ['category'])
export class Transaction {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: "varchar", length: 100 })
    name: string;

    @Column({
        type: "enum",
        enum: TypeTransaction
    })
    type: TypeTransaction;

    @Column({ type: "integer" }) // centavos
    amount: number;

    @Column({ type: 'date' })
    date: string;

    @Column({ type: "date", nullable: true })
    postedAt: Date;

    @Column({
        type: 'time',
        default: () => "'00:00:00'",
        nullable: true
    })
    time: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    /** Establecimiento donde se realizó la compra. */
    @Column({ type: "varchar", length: 150, nullable: true })
    merchantName?: string | null;

    /** Dirección del establecimiento. */
    @Column({ type: "varchar", length: 255, nullable: true })
    merchantAddress?: string | null;

    @Column({ type: "varchar", length: 11, nullable: true })
    merchantRuc?: string | null;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt: Date;

    @Column({
        type: 'boolean',
        default: false
    })
    isRecurrent: boolean;

    @Column({
        type: "enum",
        enum: TransactionReportingImpact,
        enumName: "transaction_reporting_impact_enum",
        default: TransactionReportingImpact.REPORTABLE,
    })
    reportingImpact: TransactionReportingImpact;

    @ManyToOne("Account", "transactions", { nullable: false })
    account: Account;

    @ManyToOne("Account", "transactions", { nullable: true })
    relatedAccount?: Account | null;

    @ManyToOne("Category", "transactions", { nullable: true })
    category: Category;

    @ManyToOne("User", "transactions", { nullable: false })
    user: User;

    @OneToMany("ReccurentTransaction", "transactions", { nullable: true })
    reccurentTransactions: ReccurentTransaction[];

    @OneToOne("loans", "transactions", { nullable: true })
    @JoinColumn()
    loan: Loan;

    @ManyToMany(() => Tag, (tag) => tag.transactions)
    @JoinTable({
        name: "transaction_tags",
        joinColumn: { name: "transactionId", referencedColumnName: "id" },
        inverseJoinColumn: { name: "tagId", referencedColumnName: "id" },
    })
    tags: Tag[];

    @OneToMany(() => TransactionSplit, (split) => split.transaction, { cascade: true })
    splits: TransactionSplit[];

    @OneToMany(() => TransactionItem, (item) => item.transaction, { cascade: true })
    items: TransactionItem[];

    @OneToMany("TransactionAttachment", "transaction", { cascade: true })
    attachments: TransactionAttachment[];

}