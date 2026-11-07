import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToOne, JoinColumn, OneToMany, UpdateDateColumn, DeleteDateColumn } from 'typeorm';
import { Credential } from './Credential.entity';
import { Account } from './Account.entity';
import { Category } from './Category.entity';
import { Transaction } from './Transaction.entity';
import { Loan } from './Loan.entity';
import { ReccurentTransaction } from './ReccurentTransaction.entity';
import { Codes } from './Codes.entity';


@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column()
    birthDate: Date;

    @Column({
        unique: true
    })
    phone: number;

    @Column({
        nullable: true
    })
    country: string;

    @Column({
        type: 'boolean',
        default: false
    })
    isAdmin: boolean;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt: Date;

    @DeleteDateColumn({ type: 'timestamp', nullable: true })
    deletedAt: Date | null;
    
    @Column({ type: "boolean", default: false })
    is_verified: boolean
    
    @OneToMany(() => Codes, code => code.user, { nullable: true })
    codes: Codes[]

    @OneToOne(() => Credential, credential => credential.user, { cascade: true })
    @JoinColumn()
    credential: Credential;

    @OneToMany(() => Account, account => account.user)
    accounts: Account[];

    @OneToMany(() => Category, category => category.user)
    categories: Category[];

    @OneToMany(() => Transaction, transaction => transaction.user)
    transactions: Transaction[];

    @OneToMany(() => Loan, loan => loan.user)
    loans: Loan[];

    @OneToMany(() => ReccurentTransaction, reccurentTransaction => reccurentTransaction.user)
    reccurentTransactions: ReccurentTransaction[];

}