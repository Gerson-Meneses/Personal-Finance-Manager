import { Context } from "hono";
import { TagService } from "../services/tagService";
import { TagQuerySchema, TagSchema, UpdateTagSchema } from "../schemas/tag.schema";
import { UuidSchema } from "../schemas/uuid.schema";
import { ApiPaginated } from "../typesResponseHttp/apiResponses";
import { TagResponse } from "../ResponseInterfaces/TagResponse";
import { paginated } from "../helpers/responses";

const tagService = new TagService();

export const getAllTags = async (c: Context, userId: UuidSchema, filters: TagQuerySchema) => {
    const result = await tagService.getTagsByUser(userId, filters);
    return c.json<ApiPaginated<TagResponse>>(
        paginated(result.items, result.total, result.page, result.limit),
        200
    );
};

export const getTagById = async (c: Context, userId: UuidSchema, tagId: UuidSchema) => {
    const tag = await tagService.getTagById(tagId, userId);
    return c.json(tag, 200);
};

export const createTag = async (c: Context, userId: UuidSchema, tag: TagSchema) => {
    const created = await tagService.createTag(tag, userId);
    return c.json(created, 201);
};

export const updateTag = async (
    c: Context,
    userId: UuidSchema,
    tagId: UuidSchema,
    update: UpdateTagSchema
) => {
    const updated = await tagService.updateTag(userId, tagId, update);
    return c.json(updated, 200);
};

export const deleteTag = async (c: Context, userId: UuidSchema, tagId: UuidSchema) => {
    await tagService.deleteTag(userId, tagId);
    return c.body(null, 204);
};
