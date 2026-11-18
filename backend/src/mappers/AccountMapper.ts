import { Account } from "../entities/Account.entity";
import { AccountResponse } from "../ResponseInterfaces/AccountResponse";
import { TypeAccount } from "../utils/Enums";
import { round } from "../utils/normalizarMoney";

export const toAccountResponse = (account: Account): AccountResponse => {

    let accountInfo: AccountResponse = {
        id: account.id,
        name: account.name,
        icon: account.icon || "wallet",
        color: account.color || "#004f12",
        type: account.type as TypeAccount,
        balance: round(account.balance / 100),
    };

    if (!account) {
        throw new Error("Account is undefined");
    }

    if (account.type === TypeAccount.CREDIT && account.creditLimit != null) {
        accountInfo = {
            ...accountInfo,
            billingCloseDay: account.billingCloseDay ?? undefined,
            creditLimit: round(account.creditLimit / 100),
            overdraft: account.overdraft ?? 0,
            paymentDueDay: account.paymentDueDay ?? undefined,
            currency: account.currency ?? "PEN",
            ...(account.tea != null ? { tea: account.tea } : {}),
            ...(account.tcea != null ? { tcea: account.tcea } : {}),
            ...(account.desgravamenRate != null ? { desgravamenRate: account.desgravamenRate } : {}),
            ...(account.desgravamenMaxAmount != null
                ? { desgravamenMaxAmount: round(account.desgravamenMaxAmount / 100) }
                : {}),
            ...(account.issuer ? { issuer: account.issuer } : {}),
            ...(account.brand ? { brand: account.brand } : {}),
            ...(account.last4 ? { last4: account.last4 } : {}),
            ...(account.holderName ? { holderName: account.holderName } : {}),
        }
    }

    if (account.transactions ) {
        accountInfo.transactions = account.transactions;
    }

    if (account.reccurentTransactions) {
        accountInfo.reccurentTransactions = account.reccurentTransactions;
    }

    return accountInfo;
}