import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as service from "./services";
import type { TransactionAttachment } from "../transactions/types";
import type { DataError } from "../../shared/dataApiInterface";

export const useTransactionAttachments = (transactionId?: string) => {
    const queryClient = useQueryClient();

    const attachmentsQuery = useQuery<TransactionAttachment[]>({
        queryKey: ["attachments", transactionId],
        queryFn: () => service.listAttachments(transactionId as string),
        enabled: !!transactionId,
    });

    const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: ["attachments", transactionId] });
        queryClient.invalidateQueries({ queryKey: ["transactions"] });
    };

    const uploadMutation = useMutation<
        TransactionAttachment,
        DataError<unknown>,
        { transactionId: string; file: File }
    >({
        mutationFn: ({ transactionId: id, file }) => service.uploadAttachment(id, file),
        onSuccess: invalidate,
    });

    const deleteMutation = useMutation<void, DataError<unknown>, string>({
        mutationFn: service.deleteAttachment,
        onSuccess: invalidate,
    });

    return {
        attachments: attachmentsQuery.data ?? [],
        loading: attachmentsQuery.isLoading,
        error: attachmentsQuery.error,
        refetch: attachmentsQuery.refetch,
        uploadAttachment: uploadMutation,
        deleteAttachment: deleteMutation,
    };
};
