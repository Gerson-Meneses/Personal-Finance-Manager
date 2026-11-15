import { PrimaryGeneratedColumn, Column, Entity, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, OneToOne, JoinColumn, Index } from "typeorm";
import type { User } from "./User.entity";
import { StatusLoan, TypeLoan } from "../utils/Enums";
import { Transaction } from "./Transaction.entity";
import type { Contact } from "./Contact.entity";
import type { LoanMovement } from "./LoanMovement.entity";
import type { LoanPlan } from "./LoanPlan.entity";

@Entity({
    name: "loans"
})
@Index('IDX_loans_user', ['user'])
export class Loan {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({
        type: "enum",
        enum: TypeLoan
    })
    type: TypeLoan;

    @Column({ type: "varchar", length: 100 })
    lender: string;

    @Column({
        type: 'integer',
    })
    principalAmount: number;

    @Column({
        type: 'integer',
        nullable: true
    })
    disbursementAmount?: number;

    @Column({
        type: 'integer',
        nullable: true
    })
    extraCost?: number;

    @Column({
        type: 'integer',
        nullable: true
    })
    tea?: number;

    @Column({
        type: 'integer',
        nullable: true
    })
    termInMonths?: number;

    @Column({
        type: 'integer',
        nullable: true
    })
    installmentAmount?: number;

    @Column({
        type: 'enum',
        enum: StatusLoan,
        default: StatusLoan.PENDING
    })
    status: StatusLoan;

    @Column({ type: 'date' })
    startDate: string;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt: Date;

    @Column({ type: "varchar", length: 150, nullable: true })
    notes?: string | null;

    @Column({ type: "timestamp", nullable: true })
    cancelledAt?: Date | null;

    @Column({ type: "text", nullable: true })
    cancelReason?: string | null;

    @ManyToOne("Contact", "loans", { nullable: true, onDelete: "SET NULL" })
    @JoinColumn({ name: "contactId" })
    contact?: Contact | null;

    @Column({ type: "uuid", nullable: true })
    contactId?: string | null;

    @Column()
    userId: string;

    @ManyToOne("User", "loans")
    @JoinColumn({ name: "userId" })
    user: User;

    @OneToMany("LoanMovement", "loan")
    movements: LoanMovement[];

    @OneToMany("LoanPlan", "loan")
    plans: LoanPlan[];

    @OneToOne(() => Transaction, transaction => transaction.loan)
    @JoinColumn()
    transactionReference: Transaction;

}