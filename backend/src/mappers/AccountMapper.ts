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

    if (account.billingCloseDay && account.creditLimit && account.overdraft && account.paymentDueDay) {
        accountInfo = {
            ...accountInfo,
            billingCloseDay: account.billingCloseDay,
            creditLimit: round(account.creditLimit / 100),
            overdraft: account.overdraft,
            paymentDueDay: account.paymentDueDay,
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