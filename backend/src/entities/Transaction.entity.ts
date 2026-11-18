import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, UpdateDateColumn, OneToMany, OneToOne, JoinColumn, Index, ManyToMany, JoinTable } from "typeorm";
import type { Account } from "./Account.entity";
import type { Category } from "./Category.entity";
import { CreditTransactionStatus, TransactionReportingImpact, TypeTransaction } from "../utils/Enums";
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
@Index('IDX_transactions_credit_status', ['account', 'creditStatus'])
@Index('IDX_transactions_installment_plan', ['installmentPlanId'])
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

    /** Estado del movimiento cuando la cuenta es una tarjeta de crédito. */
    @Column({
        type: "enum",
        enum: CreditTransactionStatus,
        enumName: "credit_transaction_status_enum",
        default: CreditTransactionStatus.POSTED,
    })
    creditStatus: CreditTransactionStatus;

    /** Monto autorizado originalmente; el monto final puede variar al confirmar. */
    @Column({
        type: "integer",
        nullable: true,
        comment: "Monto autorizado original en centavos"
    })
    authorizedAmount?: number | null;

    /** Momento estimado en que el comercio procesa el cargo. */
    @Column({ type: "timestamp", nullable: true })
    expectedPostAt?: Date | null;

    @Column({ type: "timestamp", nullable: true })
    confirmedAt?: Date | null;

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

    @ManyToOne("CreditInstallmentPlan", "sourceTransactions", { nullable: true, onDelete: "SET NULL" })
    @JoinColumn({ name: "installmentPlanId" })
    installmentPlan?: import("./CreditInstallmentPlan.entity").CreditInstallmentPlan | null;

    @Column({ type: "uuid", nullable: true })
    installmentPlanId?: string | null;

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