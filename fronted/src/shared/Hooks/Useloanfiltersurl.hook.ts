import { useSearchParams } from "react-router-dom";
import { useCallback } from "react";
import { defaultLoanQueryFilters, type LoanQueryFiltersFormInput } from "../../features/loans/LoanPayments/types";

/**
 * Hook para sincronizar filtros de préstamos con URL
 * Permite persistencia de filtros al compartir links o recargar la página
 * Optimizado para aplicar filtros en tiempo real sin recargar
 */
export const useLoanFiltersURL = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Parsear filtros desde URL - memoizado para evitar re-renders innecesarios
  const getFiltersFromURL = useCallback((): Partial<LoanQueryFiltersFormInput> => {
    const params = Object.fromEntries(searchParams);
    const parsed: any = {};

    try {
      // String fields
      if (params.search) parsed.search = params.search;
      if (params.type) parsed.type = params.type;
      if (params.status) parsed.status = params.status;
      if (params.lender) parsed.lender = params.lender;
      if (params.startDate) parsed.startDate = params.startDate;
      if (params.from) parsed.from = params.from;
      if (params.to) parsed.to = params.to;
      if (params.paymentDateFrom) parsed.paymentDateFrom = params.paymentDateFrom;
      if (params.paymentDateTo) parsed.paymentDateTo = params.paymentDateTo;

      // Number fields
      if (params.minAmount) parsed.minAmount = parseFloat(params.minAmount);
      if (params.maxAmount) parsed.maxAmount = parseFloat(params.maxAmount);
      if (params.minPaymentAmount) parsed.minPaymentAmount = parseFloat(params.minPaymentAmount);
      if (params.maxPaymentAmount) parsed.maxPaymentAmount = parseFloat(params.maxPaymentAmount);
      if (params.limit) parsed.limit = parseInt(params.limit, 10);
      if (params.page) parsed.page = parseInt(params.page, 10);

      // Boolean fields
      if (params.hasPayments === "true") parsed.hasPayments = true;

      // Enum fields
      if (params.orderBy) parsed.orderBy = params.orderBy;
      if (params.order) parsed.order = params.order;

      return parsed;
    } catch (error) {
      console.error("Error parsing filters from URL:", error);
      return {};
    }
  }, [searchParams]);

  // Guardar filtros a URL - sin recargar página, solo actualiza URL
  const saveFiltersToURL = useCallback((filters: Partial<LoanQueryFiltersFormInput>) => {
    try {
      const params = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        // Solo guardar valores que no son default
        if (
          value !== undefined &&
          value !== null &&
          value !== "" &&
          value !== defaultLoanQueryFilters[key as keyof LoanQueryFiltersFormInput]
        ) {
          params.set(key, String(value));
        }
      });

      // Actualizar URL sin recargar la página
      setSearchParams(params, { replace: false });
    } catch (error) {
      console.error("Error saving filters to URL:", error);
    }
  }, [setSearchParams]);

  // Limpiar todos los filtros de URL
  const clearFiltersFromURL = useCallback(() => {
    setSearchParams(new URLSearchParams(), { replace: true });
  }, [setSearchParams]);

  // Actualizar filtro individual
  const updateFilterInURL = useCallback(
    (key: keyof LoanQueryFiltersFormInput, value: any) => {
      const current = getFiltersFromURL();
      const updated = { ...current, [key]: value };

      if (value === undefined || value === null || value === "") {
        const { [key]: _, ...rest } = updated;
        saveFiltersToURL(rest);
      } else {
        saveFiltersToURL(updated);
      }
    },
    [getFiltersFromURL, saveFiltersToURL]
  );

  return {
    getFiltersFromURL,
    saveFiltersToURL,
    clearFiltersFromURL,
    updateFilterInURL,
  };
};