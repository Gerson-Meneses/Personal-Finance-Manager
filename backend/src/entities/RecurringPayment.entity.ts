import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";
import type { Account } from "./Account.entity";
import type { Category } from "./Category.entity";
import type { User } from "./User.entity";
import { RecurrenceFrequency, RecurringEntryType } from "../utils/Enums";
import type { RecurringPaymentOccurrence } from "./RecurringPaymentOccurrence.entity";

@Entity({ name: "recurring_payments" })
@Index("IDX_recurring_payments_user", ["user"])
@Index("IDX_recurring_payments_user_active", ["user", "isActive"])
export class RecurringPayment {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "varchar", length: 100 })
    name: string;

    @Column({ type: "text", nullable: true })
    description?: string | null;

    @Column({ type: "enum", enum: RecurringEntryType })
    type: RecurringEntryType;

    /** Monto en centavos */
    @Column({ type: "integer" })
    amount: number;

    @Column({ type: "enum", enum: RecurrenceFrequency })
    frequency: RecurrenceFrequency;

    /** Cada N periodos (ej. cada 2 meses) */
    @Column({ type: "integer", default: 1 })
    intervalCount: number;

    /** Día del mes para MONTHLY/YEARLY (1-31, se ajusta al último día del mes) */
    @Column({ type: "integer", nullable: true })
    dayOfMonth?: number | null;

    /** Día de la semana para WEEKLY/BIWEEKLY (0 = domingo, 6 = sábado) */
    @Column({ type: "integer", nullable: true })
    dayOfWeek?: number | null;

    @Column({ type: "date" })
    startDate: string;

    @Column({ type: "date", nullable: true })
    endDate?: string | null;

    @Column({ type: "boolean", default: true })
    isActive: boolean;

    @Column({ type: "boolean", default: false })
    autoDebit: boolean;

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

    @ManyToOne("Category", { nullable: false, onDelete: "CASCADE" })
    @JoinColumn({ name: "categoryId" })
    category: Category;

    @Column({ type: "uuid" })
    categoryId: string;

    @OneToMany("RecurringPaymentOccurrence", "payment")
    occurrences: RecurringPaymentOccurrence[];

    @CreateDateColumn({ type: "timestamp" })
    createdAt: Date;

    @UpdateDateColumn({ type: "timestamp" })
    updatedAt: Date;
}
