import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToOne, OneToMany, JoinColumn } from 'typeorm';
import type { Loan } from './Loan.entity';
import { LoanPayment } from './LoanPayment.entity';

@Entity('loan_installments')
export class LoanInstallment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne("Loan", "loan_installments")
  loan: Loan;

  @Column()
  installmentNumber: number;

  @Column({ type: 'date' })
  dueDate: Date;

  @Column({ type: 'integer' })
  totalAmount: number;

  @Column({ type: 'integer' })
  principalAmount: number;

  @Column('integer')
  interestAmount: number;

  @OneToMany(() => LoanPayment, payment => payment.loan,{nullable: true})
  @JoinColumn()
  payments: LoanPayment[];

  @Column({ type: 'enum', enum: ['PENDING', 'PAID', 'PARTIAL'], default: 'PENDING' })
  status: 'PENDING' | 'PAID' | 'PARTIAL';
}
