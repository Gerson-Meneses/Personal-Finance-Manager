import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as service from "./services";
import type { RecurringPaymentUpdate } from "./types";

export const useRecurringPayments = () => {
    const queryClient = useQueryClient();

    const paymentsQuery = useQuery({
        queryKey: ["recurringPayments"],
        queryFn: service.getRecurringPayments,
    });

    const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: ["recurringPayments"] });
        queryClient.invalidateQueries({ queryKey: ["recurringProjection"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard"] });
        queryClient.invalidateQueries({ queryKey: ["transactions"] });
        queryClient.invalidateQueries({ queryKey: ["accounts"] });
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
        mutationFn: ({ id, accountId }: { id: string; accountId?: string }) =>
            service.executeRecurringOccurrence(id, { accountId }),
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
