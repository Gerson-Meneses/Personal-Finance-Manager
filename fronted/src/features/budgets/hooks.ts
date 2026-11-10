import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as service from "./services";

export const useBudgets = (month?: string) => {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ["budgets", month ?? "current"],
        queryFn: () => service.getBudgets(month),
        placeholderData: (previousData) => previousData,
    });

    const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: ["budgets"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    };

    const upsertMutation = useMutation({
        mutationFn: service.upsertBudget,
        onSuccess: invalidate,
    });

    const deleteMutation = useMutation({
        mutationFn: service.deleteBudget,
        onSuccess: invalidate,
    });

    return {
        data: query.data,
        loading: query.isLoading,
        error: query.error,
        refetch: query.refetch,
        upsertBudget: upsertMutation,
        deleteBudget: deleteMutation,
    };
};
