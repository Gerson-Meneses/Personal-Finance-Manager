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
    queryClient.invalidateQueries({ queryKey: ["loanSummary"] })
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

  const updateLoanMutation = useMutation<
    Loan,
    DataError<Record<string, unknown>>,
    { id: string; data: Parameters<typeof service.updateLoan>[1] }
  >({
    mutationFn: ({ id, data }) => service.updateLoan(id, data),
    onSuccess: invalidateAll,
  })

  const forgiveLoanMutation = useMutation<
    Loan,
    DataError<Record<string, unknown>>,
    { id: string; data: { amount?: number; date?: string; reason?: string } }
  >({
    mutationFn: ({ id, data }) => service.forgiveLoan(id, data),
    onSuccess: invalidateAll,
  })

  const cancelLoanMutation = useMutation<
    Loan,
    DataError<Record<string, unknown>>,
    { id: string; reason?: string }
  >({
    mutationFn: ({ id, reason }) => service.cancelLoan(id, reason),
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
    updateLoan: updateLoanMutation,
    cancelLoan: cancelLoanMutation,
    forgiveLoan: forgiveLoanMutation,

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
    queryClient.invalidateQueries({ queryKey: ["loanSummary"] })
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

  const updateMovementMutation = useMutation<
    LoanPayment,
    DataError<Record<string, unknown>>,
    { loanId: string; movementId: string; data: { date?: string; note?: string | null; reason?: string } }
  >({
    mutationFn: ({ loanId, movementId, data }) => service.updateLoanMovement(loanId, movementId, data),
    onSuccess: invalidateAll,
  })

  const reverseMovementMutation = useMutation<
    LoanPayment,
    DataError<Record<string, unknown>>,
    { loanId: string; movementId: string; data: { date?: string; reason?: string } }
  >({
    mutationFn: ({ loanId, movementId, data }) => service.reverseLoanMovement(loanId, movementId, data),
    onSuccess: invalidateAll,
  })

  const quickPayMutation = useMutation<void, DataError<QuickpayOutput>, QuickpayOutput>({
    mutationFn: (data: QuickpayOutput) => service.quickPay(data),
    onSuccess: invalidateAll,
  })

  return {
    // Mutations
    createPayment: createPaymentMutation,
    updateMovement: updateMovementMutation,
    reverseMovement: reverseMovementMutation,
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