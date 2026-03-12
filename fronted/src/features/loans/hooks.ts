import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import * as service from "./services"
import type { CreateLoanDTO, CreateLoanPaymentDTO } from "./types"

export const useLoans = () => {

  const queryClient = useQueryClient()

  const loansQuery = useQuery({
    queryKey: ["loans"],
    queryFn: service.getLoans
  })

  const createLoanMutation = useMutation({
    mutationFn: (data: CreateLoanDTO) =>
      service.createLoan(data),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["loans"]
      })
    }
  })

  const createPaymentMutation = useMutation({
    mutationFn: (data: CreateLoanPaymentDTO) =>
      service.createLoanPayment( data),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["loans"]
      })
    }
  })

  const deleteLoanMutation = useMutation({
    mutationFn: (id: string) =>
      service.deleteLoan(id),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["loans"]
      })
    }
  })

  return {

    loans: loansQuery.data ?? [],
    loading: loansQuery.isLoading,

    createLoan: createLoanMutation.mutateAsync,
    payLoan: createPaymentMutation.mutateAsync,
    deleteLoan: deleteLoanMutation.mutateAsync
  }
}