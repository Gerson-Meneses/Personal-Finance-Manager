import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, UpdateDateColumn, OneToMany, OneToOne } from "typeorm";
import type { Account } from "./Account.entity";
import type { Category } from "./Category.entity";
import { TypeTransaction } from "../utils/Enums";
import type { User } from "./User.entity";
import type { ReccurentTransaction } from "./ReccurentTransaction.entity";
import type { Loan } from "./Loan.entity";
import { LoanPayment } from "./LoanPayment.entity";

@Entity({
    name: 'transactions'
})
export class Transaction {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: "varchar", length: 100 })
    name: string;

    @Column({
        type: "enum",
        enum: TypeTransaction
    })
    type: TypeTransaction;

    @Column({ type: "integer" }) // centavos
    amount: number;

    @Column({ type: 'date' })
    date: Date;

    @Column({ type: "date", nullable: true })
    postedAt: Date;

    @Column({
        type: 'time',
        default: () => "'00:00:00'",
        nullable: true
    })
    time: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

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

    @ManyToOne("Account", "transactions", { nullable: true })
    relatedAccount?: Account;

    @ManyToOne("Category", "transactions", { nullable: true })
    category: Category;

    @ManyToOne("User", "transactions", { nullable: false })
    user: User;

    @OneToMany("ReccurentTransaction", "transactions", { nullable: true })
    reccurentTransactions: ReccurentTransaction[];

    @OneToOne("loans", "transactions", { nullable: true })
    loan?: Loan;

    @OneToOne(() => LoanPayment, { nullable: true })
    loanPayment?: LoanPayment;
}