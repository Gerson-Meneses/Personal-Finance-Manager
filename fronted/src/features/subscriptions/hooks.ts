import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as service from "./services";

export const useSubscriptionHub = () => {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ["subscriptions"],
        queryFn: service.getSubscriptionHub,
        staleTime: 60_000,
    });

    const toggleMutation = useMutation({
        mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
            service.setSubscriptionActive(id, isActive),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
            queryClient.invalidateQueries({ queryKey: ["recurringPayments"] });
            queryClient.invalidateQueries({ queryKey: ["recurringProjection"] });
            queryClient.invalidateQueries({ queryKey: ["recurringSuggestions"] });
            queryClient.invalidateQueries({ queryKey: ["transactions"] });
            queryClient.invalidateQueries({ queryKey: ["accounts"] });
            queryClient.invalidateQueries({ queryKey: ["dashboard"] });
            queryClient.invalidateQueries({ queryKey: ["budgets"] });
        },
    });

    return {
        hub: query.data,
        loading: query.isLoading,
        error: query.error,
        refetch: query.refetch,
        toggleSubscription: toggleMutation,
    };
};
