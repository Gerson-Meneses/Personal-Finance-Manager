import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Transaction } from "../transactions/types";
import type { DataError } from "../../shared/dataApiInterface";
import type { PaymentCreditCardDto } from "./types";
import { payCreditCard } from "./services";

// hooks/useCreditCards.ts
export const usePayCreditCard = () => {
    const queryClient = useQueryClient();

    return useMutation<Transaction, DataError<PaymentCreditCardDto>, { cardId: string, data: PaymentCreditCardDto }>({
        mutationFn: ({ cardId, data }) => payCreditCard(cardId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["transactions"] });
            queryClient.invalidateQueries({ queryKey: ["accounts"] });
            queryClient.invalidateQueries({ queryKey: ["credit-cards"] });
        }
    });
}