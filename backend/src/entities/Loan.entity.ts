import { PrimaryGeneratedColumn, Column, Entity, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from "typeorm";
import type { User } from "./User.entity";
import { StatusLoan, TypeLoan } from "../utils/Enums";
import { LoanInstallment } from "./LoanInstallment.entity";

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
        type: 'decimal',
        precision: 10,
        scale: 2
    })
    principalAmount: number;

    @Column({
        type: 'decimal',
        precision: 10,
        scale: 2,
        nullable: true
    })
    disbursementAmount: number;

    @Column({
        type: 'decimal',
        precision: 10,
        scale: 2,
        nullable: true
    })
    extraCost: number;       

    @Column({
        type: 'decimal',
        precision: 5,
        scale: 2,
        nullable: true
    })
    tea: number;

    @Column({
        type: 'decimal',
        precision: 10,
        scale: 2,
        nullable: true
    })
    montlhyRate: number;

    @Column({
        type: 'int',
        nullable: true
    })
    termInMonths: number;
    
    @Column({
        type: 'decimal',
        precision: 10,
        scale: 2,
        nullable: true
    })
    installmentAmount: number;

    @Column({
        type: 'decimal',
        precision: 10,
        scale: 2,
        nullable: true
    })
    remainingPrincipal: number;

    @Column({
        type: 'decimal',
        precision: 10,
        scale: 2,
        nullable: true
    })
    remainingInterest: number;
    
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

    @ManyToOne("User", "loans")
    user: User; 

    @OneToMany(() => LoanInstallment, loanInstallment => loanInstallment.loan)
    installments: LoanInstallment[];
}