import { Hono } from "hono";
import { ZodError } from "zod";
import { zValidator } from "@hono/zod-validator";
import { AppEnv } from "../types";
import { zodErrorResponse } from "../helpers/zodErrorResponse";
import { tagQuerySchema, tagSchema, updateTagSchema } from "../schemas/tag.schema";
import { uuidParamSchema } from "../schemas/uuid.schema";
import { createTag, deleteTag, getAllTags, getTagById, updateTag } from "../controllers/tagController";

export const tagRouter = new Hono<AppEnv>();

tagRouter.get("/", async (c) => {
    const parsed = tagQuerySchema.safeParse(c.req.query());
    if (!parsed.success) return zodErrorResponse(parsed.error, c);
    return await getAllTags(c, c.get("user").sub, parsed.data);
});

tagRouter.get(
    "/:id",
    zValidator("param", uuidParamSchema, (result, c) => {
        if (!result.success && result.error instanceof ZodError) return zodErrorResponse(result.error, c);
    }),
    async (c) => {
        return await getTagById(c, c.get("user").sub, c.req.valid("param").id);
    }
);

tagRouter.post(
    "/",
    zValidator("json", tagSchema, (result, c) => {
        if (!result.success && result.error instanceof ZodError) return zodErrorResponse(result.error, c);
    }),
    async (c) => {
        return await createTag(c, c.get("user").sub, c.req.valid("json"));
    }
);

tagRouter.patch(
    "/:id",
    zValidator("param", uuidParamSchema, (result, c) => {
        if (!result.success && result.error instanceof ZodError) return zodErrorResponse(result.error, c);
    }),
    zValidator("json", updateTagSchema, (result, c) => {
        if (!result.success && result.error instanceof ZodError) return zodErrorResponse(result.error, c);
    }),
    async (c) => {
        return await updateTag(
            c,
            c.get("user").sub,
            c.req.valid("param").id,
            c.req.valid("json")
        );
    }
);

tagRouter.delete(
    "/:id",
    zValidator("param", uuidParamSchema, (result, c) => {
        if (!result.success && result.error instanceof ZodError) return zodErrorResponse(result.error, c);
    }),
    async (c) => {
        return await deleteTag(c, c.get("user").sub, c.req.valid("param").id);
    }
);
