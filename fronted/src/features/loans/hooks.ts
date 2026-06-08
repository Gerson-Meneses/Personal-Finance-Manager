import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import * as service from "./services"
import type {
  Loan,
  LoanQueryFilters,
  LoanSummaryGrouped,
  LoanSummaryQuerySchema,
  CreateLoanOutput,
} from "./types"
import type { DataError, Meta } from "../../shared/dataApiInterface"
import type { CreateLoanPaymentOutput, LoanPayment, QuickpayOutput } from "../LoanPayments/types"


// ============ HOOK PARA PRÉSTAMOS CON FILTROS DINÁMICOS ============
export const useLoansQuery = (filters?: LoanQueryFilters) => {
  const queryClient = useQueryClient()

  // ✅ QueryKey incluye filters → reacciona a cambios automáticamente
  const loansQuery = useQuery({
    queryKey: ["loans", filters],
    queryFn: () => service.getLoans(filters),
    placeholderData: (previousData) => previousData,
  })

  // Función auxiliar para refrescar datos relacionados
  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["loans"] })
    queryClient.invalidateQueries({ queryKey: ["transactions"] })
    queryClient.invalidateQueries({ queryKey: ["accounts"] })
    queryClient.invalidateQueries({ queryKey: ["dashboard"] })
    queryClient.invalidateQueries({ queryKey: ["summary"] })
  }

  // ============ MUTATIONS PARA PRÉSTAMOS ============
  const createLoanMutation = useMutation<
    Loan,
    DataError<CreateLoanOutput>,
    CreateLoanOutput
  >({
    mutationFn: (data: CreateLoanOutput) => service.createLoan(data),
    onSuccess: invalidateAll,
  })

  const deleteLoanMutation = useMutation<void, DataError<string>, string>({
    mutationFn: (id: string) => service.deleteLoan(id),
    onSuccess: invalidateAll,
  })

  return {
    // Datos
    loans: loansQuery.data?.data ?? ([] as Loan[]),
    meta: loansQuery.data?.meta ?? ({} as Meta),
    total: loansQuery.data?.meta.total ?? 0,
    page: loansQuery.data?.meta.page ?? 1,
    limit: loansQuery.data?.meta.limit ?? 20,
    totalPages: loansQuery.data?.meta.totalPages ?? 0,

    // Estados
    isLoading: loansQuery.isLoading,
    isFetching: loansQuery.isFetching,
    error: loansQuery.error,

    // Mutations
    createLoan: createLoanMutation,
    deleteLoan: deleteLoanMutation,

    // Utilidades
    refetch: loansQuery.refetch,
  }
}

// ============ HOOK PARA PAGOS DE PRÉSTAMOS ============
export const useLoanPayments = () => {
  const queryClient = useQueryClient()

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["loans"] })
    queryClient.invalidateQueries({ queryKey: ["transactions"] })
    queryClient.invalidateQueries({ queryKey: ["accounts"] })
    queryClient.invalidateQueries({ queryKey: ["dashboard"] })
    queryClient.invalidateQueries({ queryKey: ["summary"] })
  }

  // ============ MUTATIONS PARA PAGOS ============
  const createPaymentMutation = useMutation<
    LoanPayment,
    DataError<CreateLoanPaymentOutput>,
    CreateLoanPaymentOutput
  >({
    mutationFn: (data: CreateLoanPaymentOutput) => service.createLoanPayment(data),
    onSuccess: invalidateAll,
  })

  const quickPayMutation = useMutation<void, DataError<QuickpayOutput>, QuickpayOutput>({
    mutationFn: (data: QuickpayOutput) => service.quickPay(data),
    onSuccess: invalidateAll,
  })

  return {
    // Mutations
    createPayment: createPaymentMutation,
    quickPay: quickPayMutation,
  }
}

// ============ HOOK PARA RESUMEN DE PRÉSTAMOS (SEPARADO) ============
export const useLoanSummary = (filters?: Partial<LoanSummaryQuerySchema>) => {
  const loansQuery = useQuery({
    queryKey: ["loanSummary", filters], // ✅ Key separada para evitar conflictos
    queryFn: () => service.getSummary(filters),
    placeholderData: (previousData) => previousData,
  })

  return {
    // Datos
    summary: loansQuery.data ?? ([] as LoanSummaryGrouped[]),
    meta: loansQuery.data ?? ({} as Meta),

    // Estados
    isLoading: loansQuery.isLoading,
    isFetching: loansQuery.isFetching,
    error: loansQuery.error,

    // Utilidades
    refetch: loansQuery.refetch,
  }
}

// ============ HOOK UTILITARIO PARA INVALIDAR TODO (OPCIONAL) ============
export const useInvalidateAllLoans = () => {
  const queryClient = useQueryClient()

  return () => {
    queryClient.invalidateQueries({ queryKey: ["loans"] })
    queryClient.invalidateQueries({ queryKey: ["loanSummary"] })
    queryClient.invalidateQueries({ queryKey: ["transactions"] })
    queryClient.invalidateQueries({ queryKey: ["accounts"] })
    queryClient.invalidateQueries({ queryKey: ["dashboard"] })
  }
}