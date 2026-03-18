import { useQuery } from "@tanstack/react-query"
import * as service from "./services"
import type { DashboardResponse } from "./types"

export const useDashboard = () => {
  // 1. Pasamos el tipo directamente al genérico de useQuery
  const { data, isLoading, isError, error, refetch } = useQuery<DashboardResponse>({
    queryKey: ["dashboard"],
    queryFn: service.getDashboardData,
    // 2. Opcional: Evita peticiones constantes si los datos no cambian tan rápido
    staleTime: 1000 * 60 * 5, // 5 minutos
  })

  return {
    dashboardData: data, // Ya viene tipado correctamente, sin necesidad de "as"
    loading: isLoading,
    isError,
    error,
    refresh: refetch // Útil si quieres un botón de "actualizar" en el UI
  }
}