import { PrimaryGeneratedColumn, Column, Entity, ManyToOne } from "typeorm";
import { Loan } from "./Loan.entity";

@Entity('loan_extra_payments')
export class LoanExtraPayment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Loan)
  loan: Loan;

  @Column('decimal')
  amount: number;

  @Column({ type: 'enum', enum: ['REDUCE_TERM', 'REDUCE_INSTALLMENT'] })
  strategy: 'REDUCE_TERM' | 'REDUCE_INSTALLMENT';

  @Column({ type: 'date' })
  date: Date;
}
