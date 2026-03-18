import 'reflect-metadata'
import { DataSource } from 'typeorm'
import 'dotenv/config'
import { Account } from '../entities/Account.entity'
import { Category } from '../entities/Category.entity'
import { Credential } from '../entities/Credential.entity'
import { Loan } from '../entities/Loan.entity'
import { LoanInstallment } from '../entities/LoanInstallment.entity'
import { ReccurentTransaction } from '../entities/ReccurentTransaction.entity'
import { Transaction } from '../entities/Transaction.entity'
import { User } from '../entities/User.entity'
import { LoanPayment } from '../entities/LoanPayment.entity'

/* export const AppDataSourceProd = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
    },
    synchronize: true, // ⚠️ en producción NO uses true
    dropSchema: false, // ⚠️ en producción NO uses true
    logging: ['error'],
    entities: [Account, Category, Credential, Loan, LoanInstallment, LoanPayment ,ReccurentTransaction, Transaction, User],
})  */


export const AppDataSourceProd = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: 'admin123',
    database: 'finance_manager',
    dropSchema: false,
    synchronize: true, // ❗ solo en desarrollo
    logging: ["error"],
    entities: [Account, Category, Credential, Loan, LoanInstallment, LoanPayment, ReccurentTransaction, Transaction, User],
})

