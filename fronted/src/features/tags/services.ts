import { apiFetch } from "../../shared/api";
import type { Data } from "../../shared/dataApiInterface";
import type { Tag, TagOutput } from "./types";

export const getTags = async (search?: string): Promise<Data<Tag>> => {
    const params = new URLSearchParams({ limit: "9999" });
    if (search) params.set("search", search);
    return await apiFetch<Data<Tag>>(`/tags?${params.toString()}`);
};

export const createTag = async (data: TagOutput): Promise<Tag> =>
    await apiFetch<Tag>("/tags", {
        method: "POST",
        body: JSON.stringify(data),
    });

export const updateTag = async (id: string, data: Partial<TagOutput>): Promise<Tag> =>
    await apiFetch<Tag>(`/tags/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
    });

export const deleteTag = async (id: string): Promise<void> => {
    await apiFetch<void>(`/tags/${id}`, {
        method: "DELETE",
    });
};
