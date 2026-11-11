import { TypeTransaction } from "./Enums";

export interface BalanceState {
    type: TypeTransaction;
    amount: number;
    account?: { id: string } | null;
    relatedAccount?: { id: string } | null;
}

/**
 * Efecto puro de una transacción sobre los saldos.
 * INCOME suma a la cuenta, EXPENSE resta, TRANSFER/CREDIT_PAYMENT mueven
 * el monto desde la cuenta origen hacia la cuenta relacionada.
 */
export function computeBalanceEffect(state: BalanceState): Map<string, number> {
    const effect = new Map<string, number>();
    const add = (account: { id: string } | null | undefined, delta: number) => {
        if (!account) return;
        effect.set(account.id, (effect.get(account.id) ?? 0) + delta);
    };

    switch (state.type) {
        case TypeTransaction.INCOME:
            add(state.account, state.amount);
            break;
        case TypeTransaction.EXPENSE:
            add(state.account, -state.amount);
            break;
        case TypeTransaction.TRANSFER:
        case TypeTransaction.CREDIT_PAYMENT:
            add(state.account, -state.amount);
            add(state.relatedAccount, state.amount);
            break;
    }

    return effect;
}
