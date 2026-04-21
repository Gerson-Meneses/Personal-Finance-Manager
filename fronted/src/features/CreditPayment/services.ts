import { apiFetch } from "../../shared/api";
import type { Transaction } from "../transactions/types";
import type { PaymentCreditCardDto } from "./types";

// services/creditCard.ts
export const payCreditCard = async (cardId: string, data: PaymentCreditCardDto): Promise<Transaction> => {
    return await apiFetch<Transaction>(`/credit-card/${cardId}/pay`, {
        method: "POST",
        body: data
    });
}

