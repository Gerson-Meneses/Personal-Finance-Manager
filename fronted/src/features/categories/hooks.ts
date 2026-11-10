import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as service from "./services"
import type { Category, CategorySchemaOutput, CategorySuggestion, UpdateCategoryInput } from "./types"
import type { TransactionType } from "../transactions/types"
import type { Data, DataError } from "../../shared/dataApiInterface";


export const useCategories = (month?: string) => {
  const queryClient = useQueryClient();

  const categoriesQuery = useQuery<Data<Category>>({
    queryKey: ["categories", month ?? "all"],
    queryFn: () => service.getCategories(month),
    placeholderData: (previousData) => previousData,
  });

  // Centralizamos la invalidación para no repetir código
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["categories"] });

  const createMutation = useMutation<Category, DataError<CategorySchemaOutput>, CategorySchemaOutput>({
    mutationFn: service.createCategory,
    onSuccess: invalidate
  });

  const deleteMutation = useMutation<void, DataError<string>, string>({
    mutationFn: service.deleteCategory,
    onSuccess: invalidate
  });

  const updateMutation = useMutation<Category, DataError<CategorySchemaOutput>, CategorySchemaOutput | UpdateCategoryInput>({
    mutationFn: (data: CategorySchemaOutput | UpdateCategoryInput) => {
      if (!("categoryId" in data)) {
        throw new Error("Falta el id de la categoría a actualizar");
      }
      const { categoryId, ...payload } = data;
      return service.updateCategory(categoryId, payload);
    },
    onSuccess: invalidate
  });

  return {
    // Aseguramos que siempre haya un array de items para evitar errores de render
    categories: categoriesQuery.data?.data ?? [],
    total: categoriesQuery.data?.meta.total ?? 0,
    loading: categoriesQuery.isLoading,
    isError: categoriesQuery.isError,
    error: categoriesQuery.error,
    createCategory: createMutation,
    deleteCategory: deleteMutation,
    updateCategory: updateMutation,
    refetch: categoriesQuery.refetch
  };
};

/**
 * Sugiere la categoría más usada en el historial para el nombre indicado.
 * El texto se debouncea (400 ms) para no golpear el backend en cada tecla.
 */
export const useCategorySuggestion = (name: string, type: TransactionType, enabled = true) => {
  const [debouncedName, setDebouncedName] = useState("");

  useEffect(() => {
    const trimmed = name.trim();
    const timer = setTimeout(() => setDebouncedName(trimmed), 400);
    return () => clearTimeout(timer);
  }, [name]);

  const active = enabled && debouncedName.length >= 2;

  return useQuery<{ suggestion: CategorySuggestion | null }>({
    queryKey: ["categorySuggest", debouncedName, type],
    queryFn: () => service.suggestCategory(debouncedName, type),
    enabled: active,
    staleTime: 30_000,
    retry: false,
  });
};

