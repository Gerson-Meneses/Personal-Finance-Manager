import { apiFetch } from "../../shared/api";
import type { Transaction } from "../transactions/types";
import type { PaymentCreditCardOutput } from "./types";


// services/creditCard.ts
export const payCreditCard = async (cardId: string, data: PaymentCreditCardOutput): Promise<Transaction> => {
    return await apiFetch<Transaction>(`/credit-card/${cardId}/pay`, {
        method: "POST",
        body: data
    });
}

