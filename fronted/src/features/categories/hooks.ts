import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as service from "./services"
import type { Category, CreateCategoryDTO } from "./types"
import type { Data } from "../../shared/dataApiInterface";


export const useCategories = () => {

  const queryClient = useQueryClient()

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: service.getCategories
  })

  const createMutation = useMutation({
    mutationFn: (data: CreateCategoryDTO) =>
      service.createCategory(data),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["categories"]
      })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      service.deleteCategory(id),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["categories"]
      })
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data
    }: {
      id: string
      data: CreateCategoryDTO
    }) => service.updateCategory(id, data),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["categories"]
      })
    }
  })

  return {

    categories: categoriesQuery.data ?? {} as Data<Category>,
    loading: categoriesQuery.isLoading,

    createCategory: createMutation.mutateAsync,
    deleteCategory: deleteMutation.mutateAsync,

    updateCategory: updateMutation.mutateAsync,

    refetch: categoriesQuery.refetch
  }
}