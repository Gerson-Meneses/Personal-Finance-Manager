import 'reflect-metadata'
import { join } from 'path'
import { DataSource, DataSourceOptions, LogLevel } from 'typeorm'
import 'dotenv/config'
import { Account } from '../entities/Account.entity'
import { Category } from '../entities/Category.entity'
import { Credential } from '../entities/Credential.entity'
import { Loan } from '../entities/Loan.entity'
import { ReccurentTransaction } from '../entities/ReccurentTransaction.entity'
import { Transaction } from '../entities/Transaction.entity'
import { User } from '../entities/User.entity'
import { Codes } from '../entities/Codes.entity'
import { RecurringPayment } from '../entities/RecurringPayment.entity'
import { RecurringPaymentOccurrence } from '../entities/RecurringPaymentOccurrence.entity'
import { RecurringSuggestionDismissal } from '../entities/RecurringSuggestionDismissal.entity'
import { PaymentNotification } from '../entities/PaymentNotification.entity'
import { Budget } from '../entities/Budget.entity'
import { Contact } from '../entities/Contact.entity'
import { LoanMovement } from '../entities/LoanMovement.entity'
import { LoanPlan } from '../entities/LoanPlan.entity'
import { DebtInstallment } from '../entities/DebtInstallment.entity'
import { LoanPaymentAllocation } from '../entities/LoanPaymentAllocation.entity'
import { AuditLog } from '../entities/AuditLog.entity'
import { BankStatementLine } from '../entities/BankStatementLine.entity'
import { Tag } from '../entities/Tag.entity'
import { TransactionSplit } from '../entities/TransactionSplit.entity'
import { TransactionAttachment } from '../entities/TransactionAttachment.entity'
import { TransactionItem } from '../entities/TransactionItem.entity'

const entities = [
    Account,
    Category,
    Credential,
    Loan,
    ReccurentTransaction,
    Transaction,
    User,
    Codes,
    RecurringPayment,
    RecurringPaymentOccurrence,
    RecurringSuggestionDismissal,
    PaymentNotification,
    Budget,
    Contact,
    LoanMovement,
    LoanPlan,
    DebtInstallment,
    LoanPaymentAllocation,
    AuditLog,
    BankStatementLine,
    Tag,
    TransactionSplit,
    TransactionAttachment,
    TransactionItem,
]

// En desarrollo (bun desde src) carga *.ts; en producción (dist) carga *.js
const migrations = [join(__dirname, 'migrations', '*.{ts,js}')]

const isLocalHost = (host: string) => host === 'localhost' || host === '127.0.0.1'

const commonOptions = {
    synchronize: false as const,
    dropSchema: false as const,
    logging: ['error'] as LogLevel[],
    entities,
    migrations,
    migrationsTableName: 'migrations',
}

function buildDataSourceOptions(): DataSourceOptions {
    const sslEnv = process.env.DB_SSL // 'true' | 'false'
    // TEST_DATABASE_URL solo se usa en tests para aislar integración de la base real.
    const testDatabaseUrl = process.env.NODE_ENV === "test" ? process.env.TEST_DATABASE_URL : undefined
    const databaseUrl = testDatabaseUrl || process.env.DATABASE_URL

    // 1) Parámetros individuales (DB_HOST) → configuración local/ explícita
    // DATABASE_URL tiene prioridad si ambas variables existen (Render).
    if (process.env.DB_HOST && !databaseUrl) {
        return {
            ...commonOptions,
            type: 'postgres',
            host: process.env.DB_HOST,
            port: Number(process.env.DB_PORT ?? 5432),
            username: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            ssl: sslEnv === 'true' ? { rejectUnauthorized: false } : undefined,
        }
    }

    // 2) DATABASE_URL / TEST_DATABASE_URL → entorno con URL completa
    if (databaseUrl) {
        const useSsl = sslEnv
            ? sslEnv === 'true'
            : !isLocalHost(new URL(databaseUrl).hostname)

        return {
            ...commonOptions,
            type: 'postgres',
            url: databaseUrl,
            ssl: useSsl ? { rejectUnauthorized: false } : undefined,
        }
    }

    throw new Error(
        'Configuración de base de datos faltante: define DATABASE_URL o DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME (usa .env.example como referencia)'
    )
}

export const AppDataSourceProd = new DataSource(buildDataSourceOptions())
