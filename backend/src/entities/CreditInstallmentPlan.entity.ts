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
import type { User } from "./User.entity";
import type { Transaction } from "./Transaction.entity";
import { CreditInstallmentPlanStatus } from "../utils/Enums";
import { CreditInstallment } from "./CreditInstallment.entity";

@Entity({ name: "credit_installment_plans" })
@Index("IDX_credit_installment_plans_account", ["account"])
@Index("IDX_credit_installment_plans_user", ["user"])
export class CreditInstallmentPlan {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @ManyToOne("Account", "installmentPlans", { nullable: false, onDelete: "CASCADE" })
    @JoinColumn({ name: "accountId" })
    account: Account;

    @Column({ type: "uuid" })
    accountId: string;

    @ManyToOne("User", { nullable: false, onDelete: "CASCADE" })
    @JoinColumn({ name: "userId" })
    user: User;

    @Column({ type: "uuid" })
    userId: string;

    /** TEA usada para construir el cronograma, en porcentaje. */
    @Column({ type: "double precision", default: 0 })
    tea: number;

    /** Principal financiado, en centavos. */
    @Column({ type: "integer" })
    principal: number;

    @Column({ type: "integer" })
    installmentsCount: number;

    @Column({ type: "date" })
    firstDueDate: string;

    @Column({ type: "integer", default: 0 })
    totalInterest: number;

    @Column({ type: "integer", default: 0 })
    totalAmount: number;

    @Column({
        type: "enum",
        enum: CreditInstallmentPlanStatus,
        enumName: "credit_installment_plan_status_enum",
        default: CreditInstallmentPlanStatus.ACTIVE,
    })
    status: CreditInstallmentPlanStatus;

    @OneToMany(() => CreditInstallment, (installment) => installment.plan, { cascade: true })
    installments: CreditInstallment[];

    @OneToMany("Transaction", "installmentPlan")
    sourceTransactions: Transaction[];

    @CreateDateColumn({ type: "timestamp" })
    createdAt: Date;

    @UpdateDateColumn({ type: "timestamp" })
    updatedAt: Date;
}
