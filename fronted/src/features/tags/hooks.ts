import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as service from "./services";
import type { Tag, TagOutput, UpdateTagInput } from "./types";
import type { Data, DataError } from "../../shared/dataApiInterface";

export const useTags = () => {
    const queryClient = useQueryClient();

    const tagsQuery = useQuery<Data<Tag>>({
        queryKey: ["tags"],
        queryFn: () => service.getTags(),
        staleTime: 60_000,
    });

    const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: ["tags"] });
        queryClient.invalidateQueries({ queryKey: ["transactions"] });
    };

    const createMutation = useMutation<Tag, DataError<TagOutput>, TagOutput>({
        mutationFn: service.createTag,
        onSuccess: invalidate,
    });

    const updateMutation = useMutation<Tag, DataError<TagOutput>, UpdateTagInput>({
        mutationFn: ({ tagId, ...payload }) => service.updateTag(tagId, payload),
        onSuccess: invalidate,
    });

    const deleteMutation = useMutation<void, DataError<string>, string>({
        mutationFn: service.deleteTag,
        onSuccess: invalidate,
    });

    return {
        tags: tagsQuery.data?.data ?? [],
        total: tagsQuery.data?.meta.total ?? 0,
        loading: tagsQuery.isLoading,
        isError: tagsQuery.isError,
        error: tagsQuery.error,
        refetch: tagsQuery.refetch,
        createTag: createMutation,
        updateTag: updateMutation,
        deleteTag: deleteMutation,
    };
};
