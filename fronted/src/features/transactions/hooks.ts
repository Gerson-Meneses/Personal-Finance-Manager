import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as service from "./services";
import type { Transaction, TransactionQuerySchema, CreateTransactionDTO, UpdateTransactionDTO } from "./types";
import type { DataError } from "../../shared/dataApiInterface";

export const useTransactions = (filters?: TransactionQuerySchema) => {
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
  
  const createMutation = useMutation<Transaction, DataError<CreateTransactionDTO>, CreateTransactionDTO>({
    mutationFn: (data: CreateTransactionDTO) => service.createTransaction(data),
    onSuccess: invalidateAll,
  });

  
  const updateMutation = useMutation<Transaction, DataError<UpdateTransactionDTO>, UpdateTransactionDTO>({
    mutationFn: (data: UpdateTransactionDTO) => service.updateTransaction(data.transactionId, data),
    onSuccess: invalidateAll,
  });

  const saveTransaction = useMutation<Transaction, DataError<CreateTransactionDTO>, CreateTransactionDTO | UpdateTransactionDTO>({
    mutationFn: (data: CreateTransactionDTO | UpdateTransactionDTO) => {
      if ('transactionId' in data && data.transactionId) {
        return updateMutation.mutateAsync(data as UpdateTransactionDTO);
      }
      return createMutation.mutateAsync(data as CreateTransactionDTO);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => service.deleteTransaction(id),
    onSuccess: invalidateAll,
  });


  return {
    transactions: transactionsQuery.data?.data ?? [] as Transaction[],
    total: transactionsQuery.data?.meta.total ?? 0,
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