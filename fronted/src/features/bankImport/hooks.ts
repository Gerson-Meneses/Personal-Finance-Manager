import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as service from "./services";
import type {
    BankLinesQuery,
    BankLinesResponse,
    CreateFromBankLineInput,
    ImportBankLinesInput,
} from "./types";

const invalidateReconciliation = (
    queryClient: ReturnType<typeof useQueryClient>
) => {
    queryClient.invalidateQueries({ queryKey: ["bankImport"] });
};

const invalidateMoneyData = (
    queryClient: ReturnType<typeof useQueryClient>
) => {
    invalidateReconciliation(queryClient);
    queryClient.invalidateQueries({ queryKey: ["transactions"] });
    queryClient.invalidateQueries({ queryKey: ["accounts"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["reports"] });
};

export const useBankLines = (query: BankLinesQuery = {}) =>
    useQuery<BankLinesResponse>({
        queryKey: ["bankImport", "lines", query],
        queryFn: () => service.getBankLines(query),
        staleTime: 0,
        refetchOnMount: "always",
        placeholderData: (previousData) => previousData,
    });

export const useBankImport = () => {
    const queryClient = useQueryClient();

    const importMutation = useMutation({
        mutationFn: (data: ImportBankLinesInput) => service.importBankLines(data),
        onSuccess: () => invalidateReconciliation(queryClient),
    });

    const matchMutation = useMutation({
        mutationFn: ({
            lineId,
            transactionId,
        }: {
            lineId: string;
            transactionId: string;
        }) => service.matchBankLine(lineId, transactionId),
        onSuccess: () => invalidateReconciliation(queryClient),
    });

    const createMutation = useMutation({
        mutationFn: ({
            lineId,
            data,
        }: {
            lineId: string;
            data: CreateFromBankLineInput;
        }) => service.createTransactionFromBankLine(lineId, data),
        onSuccess: () => invalidateMoneyData(queryClient),
    });

    const ignoreMutation = useMutation({
        mutationFn: (lineId: string) => service.ignoreBankLine(lineId),
        onSuccess: () => invalidateReconciliation(queryClient),
    });

    const restoreMutation = useMutation({
        mutationFn: (lineId: string) => service.restoreBankLine(lineId),
        onSuccess: () => invalidateReconciliation(queryClient),
    });

    const unmatchMutation = useMutation({
        mutationFn: (lineId: string) => service.unmatchBankLine(lineId),
        onSuccess: () => invalidateReconciliation(queryClient),
    });

    return {
        importBankLines: importMutation,
        matchLine: matchMutation,
        createFromLine: createMutation,
        ignoreLine: ignoreMutation,
        restoreLine: restoreMutation,
        unmatchLine: unmatchMutation,
    };
};
