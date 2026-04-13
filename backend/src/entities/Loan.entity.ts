import { PrimaryGeneratedColumn, Column, Entity, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, OneToOne, JoinColumn } from "typeorm";
import type { User } from "./User.entity";
import { StatusLoan, TypeLoan } from "../utils/Enums";
import { LoanInstallment } from "./LoanInstallment.entity";
import { LoanPayment } from "./LoanPayment.entity";
import { Transaction } from "./Transaction.entity";

@Entity({
    name: "loans"
})
export class Loan {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({
        type: "enum",
        enum: TypeLoan
    })
    type: TypeLoan;

    @Column({ type: "varchar", length: 100 })
    lender: string;

    @Column({
        type: 'integer',
    })
    principalAmount: number;

    @Column({
        type: 'integer',
        nullable: true
    })
    disbursementAmount?: number;

    @Column({
        type: 'integer',
        nullable: true
    })
    extraCost?: number;

    @Column({
        type: 'integer',
        nullable: true
    })
    tea?: number;

    @Column({
        type: 'integer',
        nullable: true
    })
    termInMonths?: number;

    @Column({
        type: 'integer',
        nullable: true
    })
    installmentAmount?: number;

    @Column({
        type: 'enum',
        enum: StatusLoan,
        default: StatusLoan.PENDING
    })
    status: StatusLoan;

    @Column({ type: 'date' })
    startDate: Date;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt: Date;

    @Column()
    userId: string; // Agrega esto

    @ManyToOne("User", "loans")
    @JoinColumn({ name: "userId" })
    user: User;

    @OneToMany(() => LoanInstallment, loanInstallment => loanInstallment.loan)
    installments: LoanInstallment[];

    @OneToMany(() => LoanPayment, loanPayment => loanPayment.loan)
    @JoinColumn()
    payments: LoanPayment[];

    @OneToOne(() => Transaction, transaction => transaction.loan)
    @JoinColumn()
    transactionReference: Transaction;

}