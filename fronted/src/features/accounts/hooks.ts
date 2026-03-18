import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as service from "./services"
import type { Account, CreateAccountDTO } from "./types";
import type { Data } from "../../shared/dataApiInterface";

export const useAccounts = (id?: string) => {

  const queryClient = useQueryClient()

  const accountsQuery = useQuery({
    queryKey: ["accounts"],
    queryFn: service.getAccounts
  })

  const accountByIdQuery = useQuery({
    queryKey: ["accounts", id],
    queryFn: () => service.getAccountById(id!),
    enabled: !!id
  })

  const createMutation = useMutation({
    mutationFn: (data: CreateAccountDTO) =>
      service.createAccount(data),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["accounts"]
      })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      service.deleteAccount(id),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["accounts"]
      })
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data
    }: {
      id: string
      data: Partial<CreateAccountDTO>
    }) => service.updateAccount(id, data),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["accounts"]
      })
    }
  })

  return {

    accounts: accountsQuery.data ?? {} as Data<Account>,
    account: accountByIdQuery.data as Account,
    loading: accountsQuery.isLoading || accountByIdQuery.isLoading,

    createAccount: createMutation.mutateAsync,
    deleteAccount: deleteMutation.mutateAsync,

    updateAccount: updateMutation.mutateAsync,

    refetch: accountsQuery.refetch
  }
}