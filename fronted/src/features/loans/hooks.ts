import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import * as service from "./services"
import type { CreateLoanDTO, CreateLoanPaymentDTO, Loan, LoanPayment } from "./types"
import type { DataError } from "../../shared/dataApiInterface"

export const useLoans = () => {

  const queryClient = useQueryClient()

  const loansQuery = useQuery({
    queryKey: ["loans"],
    queryFn: service.getLoans
  })

  const createLoanMutation = useMutation<Loan, DataError<CreateLoanDTO>, CreateLoanDTO>({
    mutationFn: (data: CreateLoanDTO) =>
      service.createLoan(data),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["loans", "accounts", "dashboard"]
      })
    }
  })

  const createPaymentMutation = useMutation<LoanPayment, DataError<CreateLoanPaymentDTO>, CreateLoanPaymentDTO>({
    mutationFn: (data: CreateLoanPaymentDTO) =>
      service.createLoanPayment(data),

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

    loans: loansQuery.data?.data ?? [] as Loan[],
    total: loansQuery.data?.meta.total ?? 0,
    loading: loansQuery.isLoading,

    createLoan: createLoanMutation,
    payLoan: createPaymentMutation,
    deleteLoan: deleteLoanMutation
  }
}