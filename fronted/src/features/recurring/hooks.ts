import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as service from "./services";
import type { RecurringPaymentUpdate, RecurringSuggestionsResponse } from "./types";

export const useRecurringPayments = () => {
    const queryClient = useQueryClient();

    const paymentsQuery = useQuery({
        queryKey: ["recurringPayments"],
        queryFn: service.getRecurringPayments,
    });

    const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: ["recurringPayments"] });
        queryClient.invalidateQueries({ queryKey: ["recurringProjection"] });
        queryClient.invalidateQueries({ queryKey: ["recurringSuggestions"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard"] });
        queryClient.invalidateQueries({ queryKey: ["transactions"] });
        queryClient.invalidateQueries({ queryKey: ["accounts"] });
        queryClient.invalidateQueries({ queryKey: ["loans"] });
        queryClient.invalidateQueries({ queryKey: ["loanSummary"] });
        queryClient.invalidateQueries({ queryKey: ["summary"] });
        queryClient.invalidateQueries({ queryKey: ["budgets"] });
        queryClient.invalidateQueries({ queryKey: ["budgetSuggestions"] });
        queryClient.invalidateQueries({ queryKey: ["debtInstallments"] });
    };

    const createMutation = useMutation({
        mutationFn: service.createRecurringPayment,
        onSuccess: invalidate,
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: RecurringPaymentUpdate }) =>
            service.updateRecurringPayment(id, data),
        onSuccess: invalidate,
    });

    const deleteMutation = useMutation({
        mutationFn: service.deleteRecurringPayment,
        onSuccess: invalidate,
    });

    const executeMutation = useMutation({
        mutationFn: ({
            id,
            accountId,
            amount,
            note,
            date,
            time,
        }: {
            id: string;
            accountId?: string;
            amount?: number;
            note?: string;
            date?: string;
            time?: string;
        }) => service.executeRecurringOccurrence(id, { accountId, amount, note, date, time }),
        onSuccess: invalidate,
    });

    const skipMutation = useMutation({
        mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
            service.skipRecurringOccurrence(id, reason),
        onSuccess: invalidate,
    });

    const processDueMutation = useMutation({
        mutationFn: service.processDueRecurringPayments,
        onSuccess: invalidate,
    });

    return {
        payments: paymentsQuery.data ?? [],
        loading: paymentsQuery.isLoading,
        error: paymentsQuery.error,
        refetch: paymentsQuery.refetch,
        createPayment: createMutation,
        updatePayment: updateMutation,
        deletePayment: deleteMutation,
        executeOccurrence: executeMutation,
        skipOccurrence: skipMutation,
        processDue: processDueMutation,
    };
};

export const useRecurringSuggestions = () => {
    const queryClient = useQueryClient();
    const query = useQuery({
        queryKey: ["recurringSuggestions"],
        queryFn: service.getRecurringSuggestions,
        staleTime: 60_000,
    });

    const dismissMutation = useMutation<
        { message: string },
        Error,
        string,
        { previous?: RecurringSuggestionsResponse }
    >({
        mutationFn: service.dismissRecurringSuggestion,
        onMutate: async (suggestionId) => {
            await queryClient.cancelQueries({ queryKey: ["recurringSuggestions"] });
            const previous = queryClient.getQueryData<RecurringSuggestionsResponse>(["recurringSuggestions"]);
            if (previous) {
                queryClient.setQueryData<RecurringSuggestionsResponse>(["recurringSuggestions"], {
                    ...previous,
                    suggestions: previous.suggestions.filter((item) => item.id !== suggestionId),
                });
            }
            return { previous };
        },
        onError: (_error, _suggestionId, context) => {
            if (context?.previous) {
                queryClient.setQueryData(["recurringSuggestions"], context.previous);
            }
        },
        onSettled: () => queryClient.invalidateQueries({ queryKey: ["recurringSuggestions"] }),
    });

    return {
        suggestions: query.data?.suggestions ?? [],
        lookbackDays: query.data?.lookbackDays ?? 180,
        loading: query.isLoading,
        error: query.error,
        refetch: query.refetch,
        dismissSuggestion: dismissMutation,
    };
};

export const useRecurringProjection = (month?: string) => {
    const query = useQuery({
        queryKey: ["recurringProjection", month ?? "current"],
        queryFn: () => service.getRecurringProjection(month),
        placeholderData: (previousData) => previousData,
    });

    return {
        projection: query.data,
        loading: query.isLoading,
        error: query.error,
        refetch: query.refetch,
    };
};

export const usePaymentNotifications = () => {
    const queryClient = useQueryClient();

    const notificationsQuery = useQuery({
        queryKey: ["paymentNotifications"],
        queryFn: () => service.getPaymentNotifications(false),
        refetchInterval: 60_000,
    });

    const markRead = useMutation({
        mutationFn: service.markNotificationRead,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["paymentNotifications"] }),
    });

    const markAllRead = useMutation({
        mutationFn: service.markAllNotificationsRead,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["paymentNotifications"] }),
    });

    return {
        notifications: notificationsQuery.data ?? [],
        unread: (notificationsQuery.data ?? []).filter((notification) => !notification.readAt).length,
        loading: notificationsQuery.isLoading,
        markRead,
        markAllRead,
    };
};
