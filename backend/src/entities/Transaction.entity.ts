import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, UpdateDateColumn, OneToMany } from "typeorm";
import type { Account } from "./Account.entity";
import type { Category } from "./Category.entity";
import { TypeTransaction } from "../utils/Enums";
import type { User } from "./User.entity";
import type { ReccurentTransaction } from "./ReccurentTransaction.entity";

@Entity({
    name: 'transactions'
})

export class Transaction {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: "varchar", length: 100})
    name: string;

    @Column({
        type: "enum",
        enum: TypeTransaction
    })
    type: TypeTransaction;

    @Column()
    amount: number;

    @Column({ type: 'date' })
    date: Date;

    @Column({
        type: 'time',
        default: () => "'00:00:00'",
        nullable: true
    })
    time: string;

    @Column({type: 'text', nullable: true})
    description: string;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamp' })    
    updatedAt: Date;

    @Column({
        type: 'boolean',
        default: false
    })
    isRecurrent: boolean;

    @ManyToOne("Account", "transactions", { nullable: false })
    account: Account;

    @ManyToOne("Category", "transactions", { nullable: false })
    category: Category;

    @ManyToOne("User", "transactions", { nullable: false })
    user: User;

    @OneToMany("ReccurentTransaction", "transactions", { nullable: true })
    reccurentTransactions: ReccurentTransaction[];
}