import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as service from "./services"
import type { Category, CreateCategoryDTO } from "./types"
import type { Data } from "../../shared/dataApiInterface";


export const useCategories = () => {
  const queryClient = useQueryClient();

  const categoriesQuery = useQuery<Data<Category>>({
    queryKey: ["categories"],
    queryFn: service.getCategories
  });

  // Centralizamos la invalidación para no repetir código
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["categories"] });

  const createMutation = useMutation({
    mutationFn: service.createCategory,
    onSuccess: invalidate
  });

  const deleteMutation = useMutation({
    mutationFn: service.deleteCategory,
    onSuccess: invalidate
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<CreateCategoryDTO> }) =>
      service.updateCategory(id, data),
    onSuccess: invalidate
  });

  return {
    // Aseguramos que siempre haya un array de items para evitar errores de render
    categories: categoriesQuery.data?.data ?? [],
    total: categoriesQuery.data?.meta.total ?? 0,
    loading: categoriesQuery.isLoading,
    createCategory: createMutation.mutateAsync,
    deleteCategory: deleteMutation.mutateAsync,
    updateCategory: updateMutation.mutateAsync,
    refetch: categoriesQuery.refetch
  };
};