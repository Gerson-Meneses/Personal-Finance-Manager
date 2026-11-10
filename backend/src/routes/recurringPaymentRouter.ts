import { Hono } from "hono";
import { ZodError } from "zod";
import { zValidator } from "@hono/zod-validator";
import { AppEnv } from "../types";
import { zodErrorResponse } from "../helpers/zodErrorResponse";
import { uuidParamSchema } from "../schemas/uuid.schema";
import {
    createRecurringPayment,
    deleteRecurringPayment,
    executeRecurringOccurrence,
    getRecurringProjection,
    listRecurringPayments,
    processDueRecurringPayments,
    skipRecurringOccurrence,
    updateRecurringPayment,
} from "../controllers/recurringPaymentController";
import {
    createRecurringPaymentSchema,
    executeOccurrenceSchema,
    recurringMonthQuerySchema,
    skipOccurrenceSchema,
    updateRecurringPaymentSchema,
    type CreateRecurringPaymentOutput,
    type ExecuteOccurrenceOutput,
    type RecurringMonthQuery,
    type SkipOccurrenceOutput,
    type UpdateRecurringPaymentOutput,
} from "../schemas/recurringPayment.schema";

export const recurringPaymentRouter = new Hono<AppEnv>();

recurringPaymentRouter.get("/", async (c) => {
    const user = c.get("user");
    return await listRecurringPayments(c, user.sub);
});

recurringPaymentRouter.get("/projection", async (c) => {
    const user = c.get("user");
    const parsed = recurringMonthQuerySchema.safeParse(c.req.query());
    if (!parsed.success) return zodErrorResponse(parsed.error, c);
    const query: RecurringMonthQuery = parsed.data;
    return await getRecurringProjection(c, user.sub, query);
});

recurringPaymentRouter.post("/process-due", async (c) => {
    const user = c.get("user");
    return await processDueRecurringPayments(c, user.sub);
});

recurringPaymentRouter.post(
    "/",
    zValidator("json", createRecurringPaymentSchema, (result, c) => {
        if (!result.success && result.error instanceof ZodError) {
            return zodErrorResponse(result.error, c);
        }
    }),
    async (c) => {
        const user = c.get("user");
        const data = c.req.valid("json") as CreateRecurringPaymentOutput;
        return await createRecurringPayment(c, user.sub, data);
    }
);

recurringPaymentRouter.patch(
    "/:id",
    zValidator("param", uuidParamSchema, (result, c) => {
        if (!result.success && result.error instanceof ZodError) {
            return zodErrorResponse(result.error, c);
        }
    }),
    zValidator("json", updateRecurringPaymentSchema, (result, c) => {
        if (!result.success && result.error instanceof ZodError) {
            return zodErrorResponse(result.error, c);
        }
    }),
    async (c) => {
        const user = c.get("user");
        const paymentId = c.req.valid("param").id;
        const data = c.req.valid("json") as UpdateRecurringPaymentOutput;
        return await updateRecurringPayment(c, user.sub, paymentId, data);
    }
);

recurringPaymentRouter.delete(
    "/:id",
    zValidator("param", uuidParamSchema, (result, c) => {
        if (!result.success && result.error instanceof ZodError) {
            return zodErrorResponse(result.error, c);
        }
    }),
    async (c) => {
        const user = c.get("user");
        return await deleteRecurringPayment(c, user.sub, c.req.valid("param").id);
    }
);

recurringPaymentRouter.post(
    "/occurrences/:id/execute",
    zValidator("param", uuidParamSchema, (result, c) => {
        if (!result.success && result.error instanceof ZodError) {
            return zodErrorResponse(result.error, c);
        }
    }),
    zValidator("json", executeOccurrenceSchema, (result, c) => {
        if (!result.success && result.error instanceof ZodError) {
            return zodErrorResponse(result.error, c);
        }
    }),
    async (c) => {
        const user = c.get("user");
        const occurrenceId = c.req.valid("param").id;
        const data = c.req.valid("json") as ExecuteOccurrenceOutput;
        return await executeRecurringOccurrence(c, user.sub, occurrenceId, data);
    }
);

recurringPaymentRouter.post(
    "/occurrences/:id/skip",
    zValidator("param", uuidParamSchema, (result, c) => {
        if (!result.success && result.error instanceof ZodError) {
            return zodErrorResponse(result.error, c);
        }
    }),
    zValidator("json", skipOccurrenceSchema, (result, c) => {
        if (!result.success && result.error instanceof ZodError) {
            return zodErrorResponse(result.error, c);
        }
    }),
    async (c) => {
        const user = c.get("user");
        const occurrenceId = c.req.valid("param").id;
        const data = c.req.valid("json") as SkipOccurrenceOutput;
        return await skipRecurringOccurrence(c, user.sub, occurrenceId, data);
    }
);
