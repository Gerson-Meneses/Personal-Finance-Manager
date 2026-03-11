import { PrimaryGeneratedColumn, Column, Entity, ManyToOne, JoinColumn, OneToOne, OneToMany } from "typeorm";
import type { Loan } from "./Loan.entity";
import type { LoanInstallment } from "./LoanInstallment.entity";
import type { Transaction } from "./Transaction.entity";
import { ExtraPaymentStrategy } from "../utils/Enums";

@Entity('loan_payments')
export class LoanPayment {

  @PrimaryGeneratedColumn('uuid')
  id: string;


  @Column({ type: 'integer' })
  amount: number;

  @Column({
    type: 'enum',
    enum: ExtraPaymentStrategy,
    nullable: true
  })
  strategy?: ExtraPaymentStrategy;

  @Column({ type: 'date' })
  date: Date;

  @ManyToOne("loans", "loan_payments")
  loan: Loan;

  @ManyToOne("loan_installments", "loan_payments", { nullable: true })
  installment?: LoanInstallment;

  @OneToOne("transactions", "loan_payments")
  transaction: Transaction;
}