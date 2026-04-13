import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as service from "./services";
import type { Account, CreateAccountDTO, UpdateAccountDTO } from "./types";
import type { DataError } from "../../shared/dataApiInterface";

export const useAccounts = (id?: string) => {
  const queryClient = useQueryClient();

  // 1. Consulta de todas las cuentas
  const accountsQuery = useQuery({
    queryKey: ["accounts"],
    queryFn: service.getAccounts,
  });

  // 2. Consulta de una cuenta específica (Detalle/Edición)
  const accountByIdQuery = useQuery({
    queryKey: ["accounts", id],
    queryFn: () => service.getAccountById(id!),
    enabled: !!id,
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["accounts"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] }); // Para actualizar saldos totales
    queryClient.invalidateQueries({ queryKey: ["transactions"] }); // Por si cambió el nombre de la cuenta
  };

  const createMutation = useMutation({
    mutationFn: service.createAccount,
    onSuccess: invalidateAll,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAccountDTO }) =>
      service.updateAccount(id, data),
    onSuccess: (updatedAccount) => {
      invalidateAll();
      queryClient.setQueryData(["accounts", id], updatedAccount);
    },
  });

  const saveAccount = useMutation<Account, DataError<CreateAccountDTO>, CreateAccountDTO | UpdateAccountDTO>({
    mutationFn: (data: CreateAccountDTO | UpdateAccountDTO) => {
      if ('accountId' in data && data.accountId) {
        return updateMutation.mutateAsync({ id: data.accountId, data: data });
      }
      return createMutation.mutateAsync(data as CreateAccountDTO);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: service.deleteAccount,
    onSuccess: invalidateAll,
  });

  return {
    // Datos y Meta
    accounts: accountsQuery.data?.data ?? [] as Account[],
    meta: accountsQuery.data?.meta,
    account: accountByIdQuery.data,

    // Estados de carga (mejorados)
    loading: accountsQuery.isLoading || accountByIdQuery.isLoading,
    error: accountsQuery.error || accountByIdQuery.error,

    // Acciones
    createAccount: createMutation,
    updateAccount: updateMutation,
    saveAccount,
    deleteAccount: deleteMutation,

    // Utilidades
    refetch: accountsQuery.refetch,
  };
};