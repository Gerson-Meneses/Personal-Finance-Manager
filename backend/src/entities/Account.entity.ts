import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { TypeAccount } from "../utils/Enums";
import type { User } from "./User.entity";
import { Transaction } from "./Transaction.entity";
import { ReccurentTransaction } from "./ReccurentTransaction.entity";
import { Loan } from "./Loan.entity";

@Entity({
    name: "accounts"
})
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

}