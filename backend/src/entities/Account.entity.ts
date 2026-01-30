import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { TypeAccount } from "../utils/Enums";
import type { User } from "./User.entity";
import { Transaction } from "./Transaction.entity";
import { ReccurentTransaction } from "./ReccurentTransaction.entity";

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

    @Column()
    balance: number;

    @Column({
        nullable: true
    })
    creditLimit: number;

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