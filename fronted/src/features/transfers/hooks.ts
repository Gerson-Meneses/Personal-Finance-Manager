import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { CreateTransferDto } from "./types"
import { createTransfer } from "./services"
import type { Transaction } from "../transactions/types";
import type { DataError } from "../../shared/dataApiInterface";

export const useTransfers = () => {
    const queryClient = useQueryClient();

    const createTransferMutation = useMutation<Transaction, DataError<CreateTransferDto>, CreateTransferDto>({
        mutationFn: (data: CreateTransferDto) => createTransfer(data),
        onSuccess: () => {
            // Invalidamos las claves por separado para mayor seguridad
            queryClient.invalidateQueries({ queryKey: ["transactions"] });
            queryClient.invalidateQueries({ queryKey: ["accounts"] });

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