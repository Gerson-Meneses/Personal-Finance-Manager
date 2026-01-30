import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import type { Loan } from './Loan.entity';

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

  @Column('decimal')
  totalAmount: number;

  @Column('decimal')
  principalAmount: number;

  @Column('decimal')
  interestAmount: number;

  @Column('decimal', { default: 0 })
  paidAmount: number;

  @Column({ type: 'enum', enum: ['PENDING', 'PAID', 'PARTIAL'], default: 'PENDING' })
  status: 'PENDING' | 'PAID' | 'PARTIAL';
}
