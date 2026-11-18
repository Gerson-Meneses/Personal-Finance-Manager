import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";
import type { Account } from "./Account.entity";
import type { CreditInstallment } from "./CreditInstallment.entity";
import type { User } from "./User.entity";
import { CreditChargeSource, CreditChargeType } from "../utils/Enums";

@Entity({ name: "credit_card_charges" })
@Index("IDX_credit_card_charges_account", ["account"])
@Index("IDX_credit_card_charges_user", ["user"])
@Index("IDX_credit_card_charges_cycle", ["account", "type", "periodKey"])
export class CreditCardCharge {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @ManyToOne("Account", "creditCharges", { nullable: false, onDelete: "CASCADE" })
    @JoinColumn({ name: "accountId" })
    account: Account;

    @Column({ type: "uuid" })
    accountId: string;

    @ManyToOne("User", { nullable: false, onDelete: "CASCADE" })
    @JoinColumn({ name: "userId" })
    user: User;

    @Column({ type: "uuid" })
    userId: string;

    @Column({
        type: "enum",
        enum: CreditChargeType,
        enumName: "credit_charge_type_enum",
    })
    type: CreditChargeType;

    @Column({
        type: "enum",
        enum: CreditChargeSource,
        enumName: "credit_charge_source_enum",
        default: CreditChargeSource.MANUAL,
    })
    source: CreditChargeSource;

    /** Porcentaje aplicado, cuando corresponde (seguro o interés). */
    @Column({ type: "double precision", nullable: true })
    rate?: number | null;

    /** Base de cálculo en centavos. */
    @Column({ type: "integer", nullable: true })
    baseAmount?: number | null;

    /** Monto del cargo en centavos. */
    @Column({ type: "integer" })
    amount: number;

    /** Clave del ciclo, por ejemplo 2026-11. */
    @Column({ type: "varchar", length: 20, nullable: true })
    periodKey?: string | null;

    @Column({ type: "date" })
    closingDate: string;

    @Column({ type: "date" })
    dueDate: string;

    @ManyToOne("CreditInstallment", { nullable: true, onDelete: "CASCADE" })
    @JoinColumn({ name: "installmentId" })
    installment?: CreditInstallment | null;

    @Column({ type: "uuid", nullable: true })
    installmentId?: string | null;

    @Column({ type: "text", nullable: true })
    description?: string | null;

    /** Permite ocultar/ignorar un cargo automático sin recrearlo. */
    @Column({ type: "boolean", default: false })
    ignored: boolean;

    @CreateDateColumn({ type: "timestamp" })
    createdAt: Date;

    @UpdateDateColumn({ type: "timestamp" })
    updatedAt: Date;
}
