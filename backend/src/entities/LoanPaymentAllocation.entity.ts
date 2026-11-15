import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from "typeorm";
import type { LoanMovement } from "./LoanMovement.entity";
import type { DebtInstallment } from "./DebtInstallment.entity";

@Entity({ name: "loan_payment_allocations" })
@Index("IDX_loan_payment_allocations_movement", ["movementId"])
@Index("IDX_loan_payment_allocations_installment", ["installmentId"])
export class LoanPaymentAllocation {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @ManyToOne("LoanMovement", "allocations", { nullable: false, onDelete: "CASCADE" })
    @JoinColumn({ name: "movementId" })
    movement: LoanMovement;

    @Column({ type: "uuid" })
    movementId: string;

    @ManyToOne("DebtInstallment", "allocations", { nullable: false, onDelete: "CASCADE" })
    @JoinColumn({ name: "installmentId" })
    installment: DebtInstallment;

    @Column({ type: "uuid" })
    installmentId: string;

    @Column({ type: "integer" })
    amount: number;

    @Column({ type: "integer", default: 0 })
    principalAmount: number;

    @Column({ type: "integer", default: 0 })
    interestAmount: number;

    @Column({ type: "integer", default: 0 })
    feeAmount: number;

    @CreateDateColumn({ type: "timestamp" })
    createdAt: Date;
}
