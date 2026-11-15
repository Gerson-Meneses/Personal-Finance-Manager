import { Hono } from "hono";
import { ZodError } from "zod";
import { zValidator } from "@hono/zod-validator";
import { AppEnv } from "../types";
import { zodErrorResponse } from "../helpers/zodErrorResponse";
import { uuidParamSchema } from "../schemas/uuid.schema";
import {
    createContactSchema,
    mergeContactsSchema,
    updateContactSchema,
    type CreateContactOutput,
    type MergeContactsOutput,
    type UpdateContactOutput,
} from "../schemas/contact.schema";
import { createContact, listContacts, mergeContacts, updateContact } from "../controllers/contactController";

export const contactRouter = new Hono<AppEnv>();

contactRouter.get("/", async (c) => {
    const user = c.get("user");
    return listContacts(c, user.sub);
});

contactRouter.post(
    "/",
    zValidator("json", createContactSchema, (result, c) => {
        if (!result.success && result.error instanceof ZodError) return zodErrorResponse(result.error, c);
    }),
    async (c) => {
        const user = c.get("user");
        return createContact(c, user.sub, c.req.valid("json") as CreateContactOutput);
    }
);

contactRouter.patch(
    "/:id",
    zValidator("param", uuidParamSchema, (result, c) => {
        if (!result.success && result.error instanceof ZodError) return zodErrorResponse(result.error, c);
    }),
    zValidator("json", updateContactSchema, (result, c) => {
        if (!result.success && result.error instanceof ZodError) return zodErrorResponse(result.error, c);
    }),
    async (c) => {
        const user = c.get("user");
        return updateContact(c, user.sub, c.req.valid("param").id, c.req.valid("json") as UpdateContactOutput);
    }
);

contactRouter.post(
    "/:id/merge",
    zValidator("param", uuidParamSchema, (result, c) => {
        if (!result.success && result.error instanceof ZodError) return zodErrorResponse(result.error, c);
    }),
    zValidator("json", mergeContactsSchema, (result, c) => {
        if (!result.success && result.error instanceof ZodError) return zodErrorResponse(result.error, c);
    }),
    async (c) => {
        const user = c.get("user");
        return mergeContacts(c, user.sub, c.req.valid("param").id, c.req.valid("json") as MergeContactsOutput);
    }
);
