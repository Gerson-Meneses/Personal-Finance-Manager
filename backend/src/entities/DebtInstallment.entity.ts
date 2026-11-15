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
import type { Contact } from "./Contact.entity";
import type { Loan } from "./Loan.entity";
import type { LoanPlan } from "./LoanPlan.entity";
import { DebtInstallmentStatus } from "../utils/Enums";
import type { LoanPaymentAllocation } from "./LoanPaymentAllocation.entity";

@Entity({ name: "debt_installments" })
@Index("IDX_debt_installments_contact_due", ["contactId", "dueDate"])
@Index("IDX_debt_installments_plan_sequence", ["planId", "sequence"])
export class DebtInstallment {
    @PrimaryGeneratedColumn("uuid")
    id: string;

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

    @ManyToOne("LoanPlan", "installments", { nullable: true, onDelete: "CASCADE" })
    @JoinColumn({ name: "planId" })
    plan?: LoanPlan | null;

    @Column({ type: "uuid", nullable: true })
    planId?: string | null;

    @Column({ type: "integer" })
    sequence: number;

    @Column({ type: "date", nullable: true })
    dueDate?: string | null;

    @Column({ type: "integer" })
    amountDue: number;

    @Column({ type: "integer", default: 0 })
    principalDue: number;

    @Column({ type: "integer", default: 0 })
    interestDue: number;

    @Column({ type: "integer", default: 0 })
    feeDue: number;

    @Column({ type: "integer", default: 0 })
    paidAmount: number;

    @Column({
        type: "enum",
        enum: DebtInstallmentStatus,
        enumName: "debt_installment_status_enum",
        default: DebtInstallmentStatus.PENDING,
    })
    status: DebtInstallmentStatus;

    @OneToMany("LoanPaymentAllocation", "installment")
    allocations: LoanPaymentAllocation[];

    @CreateDateColumn({ type: "timestamp" })
    createdAt: Date;

    @UpdateDateColumn({ type: "timestamp" })
    updatedAt: Date;
}
