import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Transaction } from "../transactions/types";
import type { DataError } from "../../shared/dataApiInterface";

import { payCreditCard } from "./services";
import type { PaymentCreditCardOutput } from "./types";

// hooks/useCreditCards.ts
export const usePayCreditCard = () => {
    const queryClient = useQueryClient();

    return useMutation<Transaction, DataError<PaymentCreditCardOutput>, { cardId: string, data: PaymentCreditCardOutput }>({
        mutationFn: ({ cardId, data }) => payCreditCard(cardId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["transactions"] });
            queryClient.invalidateQueries({ queryKey: ["accounts"] });
            queryClient.invalidateQueries({ queryKey: ["credit-cards"] });
            queryClient.invalidateQueries({ queryKey: ["dashboard"] })
        }
    });
}