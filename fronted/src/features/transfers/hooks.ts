import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { TransferOutput } from "./types"
import { createTransfer } from "./services"
import type { Transaction } from "../transactions/types";
import type { DataError } from "../../shared/dataApiInterface";

export const useTransfers = () => {
    const queryClient = useQueryClient();

    const createTransferMutation = useMutation<Transaction, DataError<TransferOutput>, TransferOutput>({
        mutationFn: (data: TransferOutput) => createTransfer(data),
        onSuccess: () => {
            // Invalidamos las claves por separado para mayor seguridad
            queryClient.invalidateQueries({ queryKey: ["transactions"] });
            queryClient.invalidateQueries({ queryKey: ["accounts"] });
            queryClient.invalidateQueries({ queryKey: ["dashboard"] })

            // Si tienes una query específica para el detalle de cuenta
            queryClient.invalidateQueries({ queryKey: ["account"] });
        }
    });

    return {
        createTransfer: createTransferMutation,
        isLoading: createTransferMutation.isPending,
        error: createTransferMutation.error
    };
}