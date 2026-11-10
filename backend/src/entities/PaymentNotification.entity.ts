import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from "typeorm";
import type { RecurringPaymentOccurrence } from "./RecurringPaymentOccurrence.entity";
import type { User } from "./User.entity";

@Entity({ name: "payment_notifications" })
@Index("IDX_payment_notifications_user_read", ["userId", "readAt"])
export class PaymentNotification {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @ManyToOne("User", { nullable: false, onDelete: "CASCADE" })
    @JoinColumn({ name: "userId" })
    user: User;

    @Column({ type: "uuid" })
    userId: string;

    @ManyToOne("RecurringPaymentOccurrence", { nullable: false, onDelete: "CASCADE" })
    @JoinColumn({ name: "occurrenceId" })
    occurrence: RecurringPaymentOccurrence;

    @Column({ type: "uuid", unique: true })
    occurrenceId: string;

    @Column({ type: "varchar", length: 160 })
    title: string;

    @Column({ type: "text" })
    message: string;

    @Column({ type: "timestamp", nullable: true })
    readAt?: Date | null;

    @CreateDateColumn({ type: "timestamp" })
    createdAt: Date;
}
