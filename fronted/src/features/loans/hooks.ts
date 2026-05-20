import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import * as service from "./services"
import type {
  CreateLoanDTO,
  CreateLoanPaymentDTO,
  Loan,
  LoanQueryFilters,
  LoanPayment,
  LoanSummaryGrouped,
  LoanSummaryQuerySchema
} from "./types"
import type { DataError } from "../../shared/dataApiInterface"
import { useState } from "react"
import type { QuickPayDTO } from "./LoanPayments/types"

// ============ HOOK PRINCIPAL OPTIMIZADO ============
export const useLoans = (
  initialLoanFilters?: LoanQueryFilters,
  initialSummaryFilters?: Partial<LoanSummaryQuerySchema> // Partial para flexibilidad al iniciar
) => {
  const queryClient = useQueryClient()

  // Mantener los dos estados separados para respetar estrictamente sus contratos y tipados
  const [loanFilters, setLoanFilters] = useState<LoanQueryFilters | undefined>(initialLoanFilters)
  
  // Inicializamos el resumen con los valores por defecto requeridos por tu interfaz
  const [summaryFilters, setSummaryFilters] = useState<LoanSummaryQuerySchema>({
    ...initialSummaryFilters
  })

  // ============ QUERIES ============
  const loansQuery = useQuery({
    queryKey: ["loans", loanFilters],
    queryFn: () => service.getLoans(loanFilters),
  })

  const summaryQuery = useQuery({
    queryKey: ["summary", summaryFilters],
    queryFn: () => service.getSummary(summaryFilters)
  })

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["transactions"] });
    queryClient.invalidateQueries({ queryKey: ["accounts"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["loans"] })
    queryClient.invalidateQueries({ queryKey: ["summary"] });
    queryClient.invalidateQueries({ queryKey: ["loansByLender"] });
  };

  // ============ MUTATIONS ============
  const createLoanMutation = useMutation<Loan, DataError<CreateLoanDTO>, CreateLoanDTO>({
    mutationFn: service.createLoan,
    onSuccess: invalidateAll
  })

  const createPaymentMutation = useMutation<LoanPayment, DataError<CreateLoanPaymentDTO>, CreateLoanPaymentDTO>({
    mutationFn: service.createLoanPayment,
    onSuccess: invalidateAll
  })

  const quickPayMutation = useMutation<void, DataError<QuickPayDTO>, QuickPayDTO>({
    mutationFn: service.quickPay,
    onSuccess: invalidateAll
  })

  const deleteLoanMutation = useMutation({
    mutationFn: service.deleteLoan,
    onSuccess: invalidateAll
  })

  // ============ CONTROL DE FILTROS INTELIGENTE ============

  /**
   * Agrega o actualiza un filtro. 
   * Si la propiedad existe en ambos (ej: 'type', 'status', 'lender'), actualiza ambos automáticamente.
   */
  const addFilter = <K extends keyof LoanQueryFilters | keyof LoanSummaryQuerySchema>(
    key: K, 
    value: any
  ) => {
    // 1. ¿Aplica a los filtros de préstamos?
    const appliesToLoans = ['type', 'status', 'lender', 'search', 'startDate', 'from', 'to', 'minAmount', 'maxAmount', 'hasPayments', 'minPaymentAmount', 'maxPaymentAmount', 'paymentDateFrom', 'paymentDateTo', 'orderBy', 'order', 'page', 'limit'].includes(key as string);
    
    // 2. ¿Aplica a los filtros de resumen?
    const appliesToSummary = ['type', 'status', 'excludeCompleted', 'excludePaidOff', 'lender', 'minRemaining', 'orderBy', 'order', 'groupByLender'].includes(key as string);

    if (appliesToLoans) {
      setLoanFilters(prev => ({
        ...prev,
        [key]: value,
        page: 1 // Reset de página automático ante cambios de criterio
      } as LoanQueryFilters))
    }

    if (appliesToSummary) {
      setSummaryFilters(prev => {
        // Validación especial para evitar pisar los orderBy conflictivos
        if (key === 'orderBy' && !['totalRemaining', 'totalAmount', 'loanCount', 'lender'].includes(value)) {
          return prev; // No aplicar si el orderBy pertenece solo a Loans
        }
        return {
          ...prev,
          [key]: value
        }
      })
    }
  }

  /**
   * Remueve un filtro de donde corresponda
   */
  const removeFilter = (key: keyof LoanQueryFilters | keyof LoanSummaryQuerySchema) => {
    setLoanFilters(prev => {
      if (!prev || !(key in prev)) return prev
      const { [key as keyof LoanQueryFilters]: _, ...rest } = prev
      return Object.keys(rest).length > 0 ? (rest as LoanQueryFilters) : undefined
    })

    // Nota: En summaryFilters no podemos borrar propiedades requeridas (lender, minRemaining, etc),
    // así que si intentas borrarlas, las reseteamos a sus valores por defecto.
    setSummaryFilters(prev => {
      if (!(key in prev)) return prev
      
      const defaults: Partial<LoanSummaryQuerySchema> = {
        lender: "",
        minRemaining: 0,
        groupByLender: false,
      }

      if (key in defaults) {
        return { ...prev, [key]: defaults[key as keyof typeof defaults] }
      }

      const { [key as keyof LoanSummaryQuerySchema]: _, ...rest } = prev
      return rest as LoanSummaryQuerySchema
    })
  }

  // Limpiar filtros (Regresar a los estados iniciales limpios)
  const clearFilters = () => {
    setLoanFilters(undefined)
    setSummaryFilters({
      lender: "",
      minRemaining: 0,
      groupByLender: false,
      orderBy: "totalRemaining",
      order: "DESC"
    })
  }

  // Paginación exclusiva de la lista de préstamos
  const goToPage = (page: number) => {
    setLoanFilters(prev => ({ ...prev, page } as LoanQueryFilters))
  }

  const setPageLimit = (limit: number) => {
    setLoanFilters(prev => ({ ...prev, limit, page: 1 } as LoanQueryFilters))
  }

  return {
    // Datos y estados de carga
    loans: loansQuery.data?.data ?? ([] as Loan[]),
    summary: summaryQuery.data ?? ([] as LoanSummaryGrouped[]),
    total: loansQuery.data?.meta.total ?? 0,
    page: loansQuery.data?.meta.page ?? 1,
    limit: loansQuery.data?.meta.limit ?? 20,
    loading: loansQuery.isLoading || summaryQuery.isLoading,
    
    // Filtros expuestos por separado por si los necesitas en los inputs de la UI
    loanFilters,
    summaryFilters,

    // Mutations
    createLoan: createLoanMutation,
    payLoan: createPaymentMutation,
    quickPay: quickPayMutation,
    deleteLoan: deleteLoanMutation,

    // Métodos unificados de control
    addFilter,
    removeFilter,
    clearFilters,
    goToPage,
    setPageLimit,
  }
}