import { TypeAccount } from "../utils/Enums";
import { ReccurentTransaction } from "../entities/ReccurentTransaction.entity";
import { Transaction } from "../entities/Transaction.entity";

export interface AccountResponse {
    id: string;
    name: string;
    icon: string;
    color: string;
    type: TypeAccount;
    balance: number;
    creditLimit?: number;
    overdraft?: number;
    billingCloseDay?: number;
    paymentDueDay?: number;
    tea?: number;
    tcea?: number;
    desgravamenRate?: number;
    desgravamenMaxAmount?: number;
    currency?: string;
    issuer?: string;
    brand?: string;
    last4?: string;
    holderName?: string;
    transactions?: Transaction[]
    reccurentTransactions?: ReccurentTransaction[];
}