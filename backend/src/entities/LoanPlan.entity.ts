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
import type { User } from "./User.entity";
import type { Contact } from "./Contact.entity";
import type { Loan } from "./Loan.entity";
import { LoanPlanStatus, RecurrenceFrequency, TypeLoan } from "../utils/Enums";
import type { DebtInstallment } from "./DebtInstallment.entity";

@Entity({ name: "loan_plans" })
@Index("IDX_loan_plans_user", ["userId", "status"])
@Index("IDX_loan_plans_contact", ["contactId", "status"])
export class LoanPlan {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @ManyToOne("User", { nullable: false, onDelete: "CASCADE" })
    @JoinColumn({ name: "userId" })
    user: User;

    @Column({ type: "uuid" })
    userId: string;

    @ManyToOne("Contact", { nullable: false, onDelete: "CASCADE" })
    @JoinColumn({ name: "contactId" })
    contact: Contact;

    @Column({ type: "uuid" })
    contactId: string;

    @ManyToOne("Loan", { nullable: true, onDelete: "SET NULL" })
    @JoinColumn({ name: "loanId" })
    loan?: Loan | null;

    @Column({ type: "uuid", nullable: true })
    loanId?: string | null;

    @Column({ type: "enum", enum: TypeLoan })
    direction: TypeLoan;

    @Column({ type: "integer" })
    amountPerInstallment: number;

    @Column({ type: "enum", enum: RecurrenceFrequency, default: RecurrenceFrequency.FIFTEEN_DAYS })
    frequency: RecurrenceFrequency;

    @Column({ type: "integer", default: 1 })
    intervalCount: number;

    @Column({ type: "date" })
    startDate: string;

    @Column({ type: "integer" })
    installmentCount: number;

    @Column({
        type: "enum",
        enum: LoanPlanStatus,
        enumName: "loan_plan_status_enum",
        default: LoanPlanStatus.ACTIVE,
    })
    status: LoanPlanStatus;

    @Column({ type: "text", nullable: true })
    notes?: string | null;

    @OneToMany("DebtInstallment", "plan")
    installments: DebtInstallment[];

    @CreateDateColumn({ type: "timestamp" })
    createdAt: Date;

    @UpdateDateColumn({ type: "timestamp" })
    updatedAt: Date;
}
