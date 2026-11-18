import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from "typeorm";
import type { Account } from "./Account.entity";
import type { RecurringPaymentOccurrence } from "./RecurringPaymentOccurrence.entity";
import type { User } from "./User.entity";
import type { DebtInstallment } from "./DebtInstallment.entity";

@Entity({ name: "payment_notifications" })
@Index("IDX_payment_notifications_user_read", ["userId", "readAt"])
@Index("UQ_payment_notifications_dedupe", ["userId", "dedupeKey"], { unique: true })
export class PaymentNotification {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @ManyToOne("User", { nullable: false, onDelete: "CASCADE" })
    @JoinColumn({ name: "userId" })
    user: User;

    @Column({ type: "uuid" })
    userId: string;

    @ManyToOne("RecurringPaymentOccurrence", { nullable: true, onDelete: "CASCADE" })
    @JoinColumn({ name: "occurrenceId" })
    occurrence?: RecurringPaymentOccurrence | null;

    @Column({ type: "uuid", unique: true, nullable: true })
    occurrenceId?: string | null;

    @ManyToOne("DebtInstallment", { nullable: true, onDelete: "CASCADE" })
    @JoinColumn({ name: "installmentId" })
    installment?: DebtInstallment | null;

    @Column({ type: "uuid", unique: true, nullable: true })
    installmentId?: string | null;

    @ManyToOne("Account", { nullable: true, onDelete: "CASCADE" })
    @JoinColumn({ name: "accountId" })
    account?: Account | null;

    @Column({ type: "uuid", nullable: true })
    accountId?: string | null;

    @Column({ type: "varchar", length: 30, default: "PAYMENT" })
    kind: string;

    /** Clave estable para evitar duplicados en alertas generadas (presupuesto/tarjeta). */
    @Column({ type: "varchar", length: 200, nullable: true })
    dedupeKey?: string | null;

    @Column({ type: "varchar", length: 160 })
    title: string;

    @Column({ type: "text" })
    message: string;

    @Column({ type: "timestamp", nullable: true })
    readAt?: Date | null;

    @CreateDateColumn({ type: "timestamp" })
    createdAt: Date;
}
