import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as service from "./services";

export const useAdminUsers = (enabled = true) => {
  const queryClient = useQueryClient();

  const usersQuery = useQuery({
    queryKey: ["admin", "users"],
    queryFn: service.getUsers,
    enabled,
  });

  const deleteMutation = useMutation({
    mutationFn: service.deleteUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
  });

  return {
    users: usersQuery.data ?? [],
    loading: usersQuery.isLoading,
    isError: usersQuery.isError,
    error: usersQuery.error,
    refetch: usersQuery.refetch,
    deleteUser: deleteMutation,
  };
};
