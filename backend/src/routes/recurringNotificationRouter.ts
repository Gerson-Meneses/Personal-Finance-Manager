import { Hono } from "hono";
import { ZodError } from "zod";
import { zValidator } from "@hono/zod-validator";
import { AppEnv } from "../types";
import { zodErrorResponse } from "../helpers/zodErrorResponse";
import { uuidParamSchema } from "../schemas/uuid.schema";
import {
    listNotifications,
    markAllNotificationsRead,
    markNotificationRead,
} from "../controllers/recurringPaymentController";

export const notificationRouter = new Hono<AppEnv>();

notificationRouter.get("/", async (c) => {
    const user = c.get("user");
    const unreadOnly = c.req.query("unread") === "true";
    return await listNotifications(c, user.sub, unreadOnly);
});

notificationRouter.patch("/read-all", async (c) => {
    const user = c.get("user");
    return await markAllNotificationsRead(c, user.sub);
});

notificationRouter.patch(
    "/:id/read",
    zValidator("param", uuidParamSchema, (result, c) => {
        if (!result.success && result.error instanceof ZodError) {
            return zodErrorResponse(result.error, c);
        }
    }),
    async (c) => {
        const user = c.get("user");
        return await markNotificationRead(c, user.sub, c.req.valid("param").id);
    }
);
