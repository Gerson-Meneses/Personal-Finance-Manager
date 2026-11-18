import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as service from "./services";
import type {
    CreateChargeInput,
    CreateInstallmentPlanInput,
    UpdateChargeInput,
} from "./types";

const invalidateCard = (queryClient: ReturnType<typeof useQueryClient>, accountId?: string) => {
    queryClient.invalidateQueries({ queryKey: ["creditCardSummary", accountId] });
    queryClient.invalidateQueries({ queryKey: ["creditCardDocuments", accountId] });
    queryClient.invalidateQueries({ queryKey: ["accounts"] });
    queryClient.invalidateQueries({ queryKey: ["transactions"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
};

export const useCreditCardSummary = (accountId?: string) => {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ["creditCardSummary", accountId],
        queryFn: () => service.getSummary(accountId as string),
        enabled: !!accountId,
    });

    const confirmMutation = useMutation({
        mutationFn: (input: { transactionId: string; amount?: number; description?: string }) =>
            service.confirmPending(accountId as string, input.transactionId, {
                ...(input.amount !== undefined ? { amount: input.amount } : {}),
                ...(input.description ? { description: input.description } : {}),
            }),
        onSuccess: () => invalidateCard(queryClient, accountId),
    });

    const confirmAllMutation = useMutation({
        mutationFn: () => service.confirmAllPending(accountId as string),
        onSuccess: () => invalidateCard(queryClient, accountId),
    });

    const previewPlanMutation = useMutation({
        mutationFn: (data: CreateInstallmentPlanInput) =>
            service.previewInstallmentPlan(accountId as string, data),
    });

    const planMutation = useMutation({
        mutationFn: (data: CreateInstallmentPlanInput) =>
            service.createInstallmentPlan(accountId as string, data),
        onSuccess: () => invalidateCard(queryClient, accountId),
    });

    const cancelPlanMutation = useMutation({
        mutationFn: (planId: string) =>
            service.cancelInstallmentPlan(accountId as string, planId),
        onSuccess: () => invalidateCard(queryClient, accountId),
    });

    const chargeMutation = useMutation({
        mutationFn: (data: CreateChargeInput) =>
            service.createCharge(accountId as string, data),
        onSuccess: () => invalidateCard(queryClient, accountId),
    });

    const updateChargeMutation = useMutation({
        mutationFn: (input: { chargeId: string; data: UpdateChargeInput }) =>
            service.updateCharge(accountId as string, input.chargeId, input.data),
        onSuccess: () => invalidateCard(queryClient, accountId),
    });

    const deleteChargeMutation = useMutation({
        mutationFn: (chargeId: string) =>
            service.deleteCharge(accountId as string, chargeId),
        onSuccess: () => invalidateCard(queryClient, accountId),
    });

    return {
        summary: query.data,
        loading: query.isLoading,
        isFetching: query.isFetching,
        error: query.error,
        refetch: query.refetch,
        confirmPending: confirmMutation,
        confirmAllPending: confirmAllMutation,
        previewInstallmentPlan: previewPlanMutation,
        createInstallmentPlan: planMutation,
        cancelInstallmentPlan: cancelPlanMutation,
        createCharge: chargeMutation,
        updateCharge: updateChargeMutation,
        deleteCharge: deleteChargeMutation,
    };
};

export const useCreditCardDocuments = (accountId?: string) => {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ["creditCardDocuments", accountId],
        queryFn: () => service.listDocuments(accountId as string),
        enabled: !!accountId,
    });

    const uploadMutation = useMutation({
        mutationFn: (input: {
            file: File;
            type?: string;
            extractedData?: Record<string, unknown> | null;
        }) =>
            service.uploadDocument(accountId as string, input.file, {
                type: input.type,
                extractedData: input.extractedData,
            }),
        onSuccess: () => invalidateCard(queryClient, accountId),
    });

    const deleteMutation = useMutation({
        mutationFn: (documentId: string) =>
            service.deleteDocument(accountId as string, documentId),
        onSuccess: () => invalidateCard(queryClient, accountId),
    });

    return {
        documents: query.data ?? [],
        loading: query.isLoading,
        error: query.error,
        refetch: query.refetch,
        uploadDocument: uploadMutation,
        deleteDocument: deleteMutation,
    };
};
