import { Column, CreateDateColumn, Entity, Index, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { TypeAccount } from "../utils/Enums";
import type { User } from "./User.entity";
import { Transaction } from "./Transaction.entity";
import { ReccurentTransaction } from "./ReccurentTransaction.entity";
import { Loan } from "./Loan.entity";

@Entity({
    name: "accounts"
})
@Index('IDX_accounts_user', ['user'])
export class Account {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "varchar", length: 100, nullable: false })
    name: string;

    @Column({
        type: "enum",
        enum: TypeAccount
    })
    type: TypeAccount;

    @Column({
        type: "integer",
        comment: "Balance en centavos"
    })
    balance: number;

    @Column({
        default: "#004f12",
        nullable: true
    })
    color: string

    @Column({
        default: "wallet",
        nullable: true
    })
    icon: string

    @Column({
        nullable: true,
        type: "integer",
        comment: "Credito Limite en centavos"
    })
    creditLimit: number;

    @Column({
        type: "integer",
        nullable: true,
        comment: "Porcentaje del 0 al 100"
    })
    overdraft: number;

    @Column({
        nullable: true,
    })
    billingCloseDay: number;

    @Column({
        nullable: true
    })
    paymentDueDay: number;

    /** Tasa efectiva anual, en porcentaje (ej. 45.50). Opcional. */
    @Column({ type: "double precision", nullable: true })
    tea?: number | null;

    /** Tasa de costo efectivo anual, en porcentaje. Solo informativa. */
    @Column({ type: "double precision", nullable: true })
    tcea?: number | null;

    /** Porcentaje del seguro de desgravamen aplicado a los gastos del ciclo. */
    @Column({ type: "double precision", nullable: true })
    desgravamenRate?: number | null;

    /** Tope del seguro de desgravamen por ciclo, en centavos. */
    @Column({
        type: "integer",
        nullable: true,
        comment: "Tope del seguro de desgravamen por ciclo en centavos"
    })
    desgravamenMaxAmount?: number | null;

    @Column({ type: "varchar", length: 3, nullable: true })
    currency?: string | null;

    @Column({ type: "varchar", length: 100, nullable: true })
    issuer?: string | null;

    @Column({ type: "varchar", length: 30, nullable: true })
    brand?: string | null;

    @Column({ type: "varchar", length: 4, nullable: true })
    last4?: string | null;

    @Column({ type: "varchar", length: 150, nullable: true })
    holderName?: string | null;

    /** Desde cuando se generan cargos automaticos de la tarjeta. */
    @Column({ type: "timestamp", nullable: true, default: () => "now()" })
    creditTrackingStartedAt?: Date | null;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt: Date;

    @ManyToOne("User", "accounts", { nullable: false })
    user: User;

    @OneToMany(() => Transaction, transaction => transaction.account, { nullable: true })
    transactions: Transaction[];

    @OneToMany(() => ReccurentTransaction, reccurentTransaction => reccurentTransaction.account, { nullable: true })
    reccurentTransactions: ReccurentTransaction[];

    @OneToMany("CreditInstallmentPlan", "account", { nullable: true })
    installmentPlans: import("./CreditInstallmentPlan.entity").CreditInstallmentPlan[];

    @OneToMany("CreditCardCharge", "account", { nullable: true })
    creditCharges: import("./CreditCardCharge.entity").CreditCardCharge[];

    @OneToMany("CreditCardDocument", "account", { nullable: true })
    creditDocuments: import("./CreditCardDocument.entity").CreditCardDocument[];

}