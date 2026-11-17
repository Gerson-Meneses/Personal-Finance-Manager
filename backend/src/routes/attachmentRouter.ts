import { Hono } from "hono";
import { z } from "zod";
import { ZodError } from "zod";
import { zValidator } from "@hono/zod-validator";
import { AppEnv } from "../types";
import { zodErrorResponse } from "../helpers/zodErrorResponse";
import { uuidParamSchema } from "../schemas/uuid.schema";
import {
    deleteAttachment,
    downloadAttachment,
    listAttachments,
    uploadAttachment,
} from "../controllers/attachmentController";

const transactionParamSchema = z.object({ transactionId: z.uuid() });

export const attachmentRouter = new Hono<AppEnv>();

attachmentRouter.post(
    "/transaction/:transactionId",
    zValidator("param", transactionParamSchema, (result, c) => {
        if (!result.success && result.error instanceof ZodError) return zodErrorResponse(result.error, c);
    }),
    async (c) => {
        return await uploadAttachment(
            c,
            c.get("user").sub,
            c.req.valid("param").transactionId
        );
    }
);

attachmentRouter.get(
    "/transaction/:transactionId",
    zValidator("param", transactionParamSchema, (result, c) => {
        if (!result.success && result.error instanceof ZodError) return zodErrorResponse(result.error, c);
    }),
    async (c) => {
        return await listAttachments(
            c,
            c.get("user").sub,
            c.req.valid("param").transactionId
        );
    }
);

attachmentRouter.get(
    "/:id/download",
    zValidator("param", uuidParamSchema, (result, c) => {
        if (!result.success && result.error instanceof ZodError) return zodErrorResponse(result.error, c);
    }),
    async (c) => {
        return await downloadAttachment(c, c.get("user").sub, c.req.valid("param").id);
    }
);

attachmentRouter.delete(
    "/:id",
    zValidator("param", uuidParamSchema, (result, c) => {
        if (!result.success && result.error instanceof ZodError) return zodErrorResponse(result.error, c);
    }),
    async (c) => {
        return await deleteAttachment(c, c.get("user").sub, c.req.valid("param").id);
    }
);
