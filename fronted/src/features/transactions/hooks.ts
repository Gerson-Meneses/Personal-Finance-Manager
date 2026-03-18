import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTransactions, createTransaction } from "./services";
import type { TransactionQuerySchema } from "./types";


export function useTransactions(data?: TransactionQuerySchema) {
  return useQuery({
    queryKey: ["transactions"],
    queryFn: () => getTransactions(data),
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}
