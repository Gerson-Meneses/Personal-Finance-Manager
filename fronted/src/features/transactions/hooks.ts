import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as service from "./services";
import type { Transaction, TransactionOutput, TransactionQuerySchemaOutput, UpdateTransactionOutput } from "./types";
import type { DataError, Meta } from "../../shared/dataApiInterface";

export const useTransactions = (filters?: TransactionQuerySchemaOutput) => {
  const queryClient = useQueryClient();

  // 1. Consulta de transacciones (con filtros dinámicos)
  const transactionsQuery = useQuery({
    queryKey: ["transactions", filters],
    queryFn: () => service.getTransactions(filters),
    placeholderData: (previousData) => previousData, // Mantiene los datos viejos mientras carga los nuevos (evita parpadeo)
  });

  // Función auxiliar para refrescar datos relacionados
  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["transactions"] });
    queryClient.invalidateQueries({ queryKey: ["accounts"] }); // Para actualizar balances en la vista de cuentas
    queryClient.invalidateQueries({ queryKey: ["dashboard"] }); // Crucial para actualizar balances
  };

  const createMutation = useMutation<Transaction, DataError<TransactionOutput>, TransactionOutput>({
    mutationFn: (data: TransactionOutput) => service.createTransaction(data),
    onSuccess: invalidateAll,
  });


  const updateMutation = useMutation<Transaction, DataError<UpdateTransactionOutput>, UpdateTransactionOutput>({
    mutationFn: (data: UpdateTransactionOutput) => service.updateTransaction(data.transactionId, data),
    onSuccess: invalidateAll,
  });

  const saveTransaction = useMutation<Transaction, DataError<TransactionOutput>, TransactionOutput | UpdateTransactionOutput>({
    mutationFn: (data: TransactionOutput | UpdateTransactionOutput) => {
      if ('transactionId' in data && data.transactionId) {
        return updateMutation.mutateAsync(data as UpdateTransactionOutput);
      }
      return createMutation.mutateAsync(data as TransactionOutput);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => service.deleteTransaction(id),
    onSuccess: invalidateAll,
  });


  return {
    transactions: transactionsQuery.data?.data ?? [] as Transaction[],
    meta: transactionsQuery.data?.meta ?? {} as Meta,
    loading: transactionsQuery.isLoading,
    isFetching: transactionsQuery.isFetching,
    error: transactionsQuery.error,

    createTransaction: createMutation,
    updateTransaction: updateMutation,
    saveTransaction,
    deleteTransaction: deleteMutation,

    refetch: transactionsQuery.refetch,
  };
};