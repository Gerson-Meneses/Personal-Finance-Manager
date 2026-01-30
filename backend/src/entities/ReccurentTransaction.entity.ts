import { PrimaryGeneratedColumn, Entity, Column, ManyToOne } from "typeorm";
import type { Transaction } from "./Transaction.entity";
import { TypeTransaction } from "../utils/Enums";
import type { User } from "./User.entity";
import type { Account } from "./Account.entity";
import type { Category } from "./Category.entity";

@Entity({
    name: 'reccurent_transactions'
})

export class ReccurentTransaction {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: "varchar", length: 100 })
    name: string;

    @Column({
        type: 'enum',
        enum: TypeTransaction
    })
    type: TypeTransaction;

    @Column({
        type: 'decimal',
        precision: 10,
        scale: 2
    })
    amount: number;

    @Column({
        type: "varchar",
        length: 100,
        nullable: true
    })
    description: string;

    @Column({
        type: 'int',
    })
    frequency: number;

    @Column({
        type: 'int',
        default: 1
    })
    frequencyCount: number;

    @Column({ type: 'date' })
    startDate: Date;

    @Column({ type: 'date', nullable: true })
    endDate: Date | null;

    @Column({
        type: 'boolean',
        default: true
    })
    isActive: boolean;

    @ManyToOne("User", "reccurentTransactions")
    user: User;

    @ManyToOne("Transaction", "reccurentTransactions")
    transaction: Transaction;

    @ManyToOne("Account", "reccurentTransactions", { nullable: false })
    account: Account;

    @ManyToOne("Category", "reccurentTransactions", { nullable: false })
    category: Category;
}