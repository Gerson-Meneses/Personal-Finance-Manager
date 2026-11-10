import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    Unique,
    UpdateDateColumn,
} from "typeorm";
import type { Account } from "./Account.entity";
import type { RecurringPayment } from "./RecurringPayment.entity";
import type { Transaction } from "./Transaction.entity";
import type { User } from "./User.entity";
import { RecurringEntryType, RecurringOccurrenceStatus } from "../utils/Enums";

@Entity({ name: "recurring_payment_occurrences" })
@Unique("UQ_recurring_occurrence_payment_date", ["paymentId", "dueDate"])
@Index("IDX_recurring_occurrences_user_due", ["userId", "dueDate"])
@Index("IDX_recurring_occurrences_status", ["status"])
export class RecurringPaymentOccurrence {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @ManyToOne("RecurringPayment", "occurrences", { nullable: false, onDelete: "CASCADE" })
    @JoinColumn({ name: "paymentId" })
    payment: RecurringPayment;

    @Column({ type: "uuid" })
    paymentId: string;

    @ManyToOne("User", { nullable: false, onDelete: "CASCADE" })
    @JoinColumn({ name: "userId" })
    user: User;

    @Column({ type: "uuid" })
    userId: string;

    @Column({ type: "date" })
    dueDate: string;

    /** Monto en centavos, copiado al momento de materializar la ocurrencia */
    @Column({ type: "integer" })
    amount: number;

    @Column({ type: "enum", enum: RecurringEntryType })
    type: RecurringEntryType;

    @Column({
        type: "enum",
        enum: RecurringOccurrenceStatus,
        default: RecurringOccurrenceStatus.PENDING,
    })
    status: RecurringOccurrenceStatus;

    @ManyToOne("Account", { nullable: true, onDelete: "SET NULL" })
    @JoinColumn({ name: "accountId" })
    account?: Account | null;

    @Column({ type: "uuid", nullable: true })
    accountId?: string | null;

    @Column({ type: "boolean", default: false })
    autoDebit: boolean;

    @ManyToOne("Transaction", { nullable: true, onDelete: "SET NULL" })
    @JoinColumn({ name: "transactionId" })
    transaction?: Transaction | null;

    @Column({ type: "uuid", nullable: true })
    transactionId?: string | null;

    @Column({ type: "timestamp", nullable: true })
    notifiedAt?: Date | null;

    @Column({ type: "timestamp", nullable: true })
    executedAt?: Date | null;

    @Column({ type: "text", nullable: true })
    failureReason?: string | null;

    @CreateDateColumn({ type: "timestamp" })
    createdAt: Date;

    @UpdateDateColumn({ type: "timestamp" })
    updatedAt: Date;
}
