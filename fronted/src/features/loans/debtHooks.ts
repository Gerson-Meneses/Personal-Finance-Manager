import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as service from "./debtServices";
import type { CreateContactPlanInput, CreateLoanPlanInput, PayInstallmentInput } from "./planTypes";

const invalidateDebt = (queryClient: ReturnType<typeof useQueryClient>) => {
    queryClient.invalidateQueries({ queryKey: ["debtInstallments"] });
    queryClient.invalidateQueries({ queryKey: ["loans"] });
    queryClient.invalidateQueries({ queryKey: ["loanSummary"] });
    queryClient.invalidateQueries({ queryKey: ["transactions"] });
    queryClient.invalidateQueries({ queryKey: ["accounts"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["recurringSuggestions"] });
    queryClient.invalidateQueries({ queryKey: ["reports"] });
};

export const useLoanPlans = (loanId?: string) => {
    const queryClient = useQueryClient();
    const query = useQuery({
        queryKey: ["loanPlans", loanId],
        queryFn: () => service.getLoanPlans(loanId!),
        enabled: !!loanId,
    });

    const createMutation = useMutation({
        mutationFn: ({ loanId, data }: { loanId: string; data: CreateLoanPlanInput }) =>
            service.createLoanPlan(loanId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["loanPlans"] });
            invalidateDebt(queryClient);
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ planId, data }: { planId: string; data: Partial<CreateLoanPlanInput> }) =>
            service.updateLoanPlan(planId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["loanPlans"] });
            invalidateDebt(queryClient);
        },
    });

    const pauseMutation = useMutation({
        mutationFn: (planId: string) => service.pauseLoanPlan(planId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["loanPlans"] });
            invalidateDebt(queryClient);
        },
    });

    const resumeMutation = useMutation({
        mutationFn: (planId: string) => service.resumeLoanPlan(planId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["loanPlans"] });
            invalidateDebt(queryClient);
        },
    });

    const cancelMutation = useMutation({
        mutationFn: ({ planId, reason }: { planId: string; reason?: string }) =>
            service.cancelLoanPlan(planId, reason),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["loanPlans"] });
            invalidateDebt(queryClient);
        },
    });

    return {
        plans: query.data ?? [],
        loading: query.isLoading,
        createPlan: createMutation,
        updatePlan: updateMutation,
        pausePlan: pauseMutation,
        resumePlan: resumeMutation,
        cancelPlan: cancelMutation,
    };
};

export const useDebtInstallments = (month?: string) => {
    const queryClient = useQueryClient();
    const query = useQuery({
        queryKey: ["debtInstallments", month],
        queryFn: () => service.getDebtInstallments(month),
    });

    const payMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: PayInstallmentInput }) =>
            service.payDebtInstallment(id, data),
        onSuccess: () => invalidateDebt(queryClient),
    });

    return {
        installments: query.data ?? [],
        loading: query.isLoading,
        error: query.error,
        refetch: query.refetch,
        payInstallment: payMutation,
    };
};

export const useCreateContactPlan = () => {
    const queryClient = useQueryClient();
    const mutation = useMutation({
        mutationFn: ({ contactId, data }: { contactId: string; data: CreateContactPlanInput }) =>
            service.createContactPlan(contactId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["loanPlans"] });
            invalidateDebt(queryClient);
        },
    });
    return mutation;
};

export const useContactPlans = (contactId?: string) => {
    const queryClient = useQueryClient();
    const query = useQuery({
        queryKey: ["contactPlans", contactId],
        queryFn: () => service.getContactPlans(contactId!),
        enabled: !!contactId,
    });

    const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: ["contactPlans"] });
        invalidateDebt(queryClient);
    };

    const updateMutation = useMutation({
        mutationFn: ({ planId, data }: { planId: string; data: Partial<CreateLoanPlanInput> }) =>
            service.updateLoanPlan(planId, data),
        onSuccess: invalidate,
    });

    const pauseMutation = useMutation({
        mutationFn: (planId: string) => service.pauseLoanPlan(planId),
        onSuccess: invalidate,
    });

    const resumeMutation = useMutation({
        mutationFn: (planId: string) => service.resumeLoanPlan(planId),
        onSuccess: invalidate,
    });

    const cancelMutation = useMutation({
        mutationFn: ({ planId, reason }: { planId: string; reason?: string }) =>
            service.cancelLoanPlan(planId, reason),
        onSuccess: invalidate,
    });

    return {
        plans: query.data ?? [],
        loading: query.isLoading,
        updatePlan: updateMutation,
        pausePlan: pauseMutation,
        resumePlan: resumeMutation,
        cancelPlan: cancelMutation,
    };
};
