import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as service from "./services";

export const useContacts = () => {
    const queryClient = useQueryClient();
    const query = useQuery({
        queryKey: ["contacts"],
        queryFn: service.getContacts,
        staleTime: 60_000,
    });

    const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: ["contacts"] });
        queryClient.invalidateQueries({ queryKey: ["loans"] });
        queryClient.invalidateQueries({ queryKey: ["loanSummary"] });
    };

    const createMutation = useMutation({
        mutationFn: (data: { name: string; notes?: string }) => service.createContact(data),
        onSuccess: invalidate,
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: { name?: string; notes?: string | null; archived?: boolean } }) =>
            service.updateContact(id, data),
        onSuccess: invalidate,
    });

    const mergeMutation = useMutation({
        mutationFn: ({ id, targetContactId }: { id: string; targetContactId: string }) =>
            service.mergeContacts(id, targetContactId),
        onSuccess: invalidate,
    });

    return {
        contacts: query.data ?? [],
        loading: query.isLoading,
        fetching: query.isFetching,
        error: query.error,
        refetch: query.refetch,
        createContact: createMutation,
        updateContact: updateMutation,
        mergeContacts: mergeMutation,
    };
};
