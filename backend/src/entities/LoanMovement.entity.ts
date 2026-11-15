import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn,
} from "typeorm";
import type { Loan } from "./Loan.entity";
import type { Transaction } from "./Transaction.entity";
import { LoanMovementType } from "../utils/Enums";
import type { LoanPaymentAllocation } from "./LoanPaymentAllocation.entity";

@Entity({ name: "loan_movements" })
@Index("IDX_loan_movements_loan_date", ["loanId", "date"])
export class LoanMovement {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @ManyToOne("Loan", "movements", { nullable: false, onDelete: "CASCADE" })
    @JoinColumn({ name: "loanId" })
    loan: Loan;

    @Column({ type: "uuid" })
    loanId: string;

    @Column({ type: "enum", enum: LoanMovementType, enumName: "loan_movement_type_enum" })
    type: LoanMovementType;

    /** Centavos. Puede ser negativo solo para ADJUSTMENT. */
    @Column({ type: "integer" })
    amount: number;

    @Column({ type: "date" })
    date: string;

    @Column({ type: "time", nullable: true })
    time?: string | null;

    @Column({ type: "text", nullable: true })
    note?: string | null;

    @Column({ type: "jsonb", nullable: true })
    metadata?: Record<string, unknown> | null;

    @OneToOne("Transaction", { nullable: true, onDelete: "SET NULL" })
    @JoinColumn({ name: "transactionId" })
    transaction?: Transaction | null;

    @Column({ type: "uuid", nullable: true })
    transactionId?: string | null;

    @Column({ type: "uuid", nullable: true, unique: true })
    reversalOfMovementId?: string | null;

    @OneToMany("LoanPaymentAllocation", "movement")
    allocations: LoanPaymentAllocation[];

    @CreateDateColumn({ type: "timestamp" })
    createdAt: Date;
}
