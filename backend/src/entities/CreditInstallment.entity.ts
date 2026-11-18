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
import type { CreditInstallmentPlan } from "./CreditInstallmentPlan.entity";
import { CreditInstallmentStatus } from "../utils/Enums";

@Entity({ name: "credit_installments" })
@Unique("UQ_credit_installments_plan_number", ["plan", "number"])
@Index("IDX_credit_installments_due", ["dueDate", "status"])
export class CreditInstallment {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @ManyToOne("CreditInstallmentPlan", "installments", { nullable: false, onDelete: "CASCADE" })
    @JoinColumn({ name: "planId" })
    plan: CreditInstallmentPlan;

    @Column({ type: "uuid" })
    planId: string;

    @Column({ type: "integer" })
    number: number;

    @Column({ type: "date" })
    closingDate: string;

    @Column({ type: "date" })
    dueDate: string;

    /** Parte de capital de la cuota, en centavos. */
    @Column({ type: "integer" })
    principal: number;

    /** Interés de la cuota, en centavos. */
    @Column({ type: "integer", default: 0 })
    interest: number;

    @Column({ type: "integer" })
    total: number;

    @Column({
        type: "enum",
        enum: CreditInstallmentStatus,
        enumName: "credit_installment_status_enum",
        default: CreditInstallmentStatus.PENDING,
    })
    status: CreditInstallmentStatus;

    @Column({ type: "integer", default: 0 })
    paidAmount: number;

    @CreateDateColumn({ type: "timestamp" })
    createdAt: Date;

    @UpdateDateColumn({ type: "timestamp" })
    updatedAt: Date;
}
