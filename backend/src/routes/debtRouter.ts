import { Hono } from "hono";
import { ZodError } from "zod";
import { zValidator } from "@hono/zod-validator";
import { AppEnv } from "../types";
import { zodErrorResponse } from "../helpers/zodErrorResponse";
import { uuidParamSchema } from "../schemas/uuid.schema";
import {
    cancelLoanPlanSchema,
    createContactLoanPlanSchema,
    createLoanPlanSchema,
    debtMonthQuerySchema,
    payInstallmentSchema,
    updateLoanPlanSchema,
    type CancelLoanPlanOutput,
    type CreateContactLoanPlanOutput,
    type CreateLoanPlanOutput,
    type DebtMonthQuery,
    type PayInstallmentOutput,
    type UpdateLoanPlanOutput,
} from "../schemas/loanPlan.schema";
import {
    cancelLoanPlan,
    createContactLoanPlan,
    createLoanPlan,
    listContactLoanPlans,
    listDebtInstallments,
    listLoanPlans,
    payDebtInstallment,
    pauseLoanPlan,
    resumeLoanPlan,
    updateLoanPlan,
} from "../controllers/debtController";

export const debtRouter = new Hono<AppEnv>();

debtRouter.get("/plans/:loanId", zValidator("param", uuidParamSchema, (result, c) => {
    if (!result.success && result.error instanceof ZodError) return zodErrorResponse(result.error, c);
}), async (c) => {
    const user = c.get("user");
    return listLoanPlans(c, user.sub, c.req.valid("param").id);
});

debtRouter.post(
    "/plans/:loanId",
    zValidator("param", uuidParamSchema, (result, c) => {
        if (!result.success && result.error instanceof ZodError) return zodErrorResponse(result.error, c);
    }),
    zValidator("json", createLoanPlanSchema, (result, c) => {
        if (!result.success && result.error instanceof ZodError) return zodErrorResponse(result.error, c);
    }),
    async (c) => {
        const user = c.get("user");
        return createLoanPlan(
            c,
            user.sub,
            c.req.valid("param").id,
            c.req.valid("json") as CreateLoanPlanOutput
        );
    }
);

debtRouter.get(
    "/plans/contact/:contactId",
    zValidator("param", uuidParamSchema, (result, c) => {
        if (!result.success && result.error instanceof ZodError) return zodErrorResponse(result.error, c);
    }),
    async (c) => {
        const user = c.get("user");
        return listContactLoanPlans(c, user.sub, c.req.valid("param").id);
    }
);

debtRouter.post(
    "/plans/contact/:contactId",
    zValidator("param", uuidParamSchema, (result, c) => {
        if (!result.success && result.error instanceof ZodError) return zodErrorResponse(result.error, c);
    }),
    zValidator("json", createContactLoanPlanSchema, (result, c) => {
        if (!result.success && result.error instanceof ZodError) return zodErrorResponse(result.error, c);
    }),
    async (c) => {
        const user = c.get("user");
        return createContactLoanPlan(
            c,
            user.sub,
            c.req.valid("param").id,
            c.req.valid("json") as CreateContactLoanPlanOutput
        );
    }
);

debtRouter.patch(
    "/plans/:planId",
    zValidator("param", uuidParamSchema, (result, c) => {
        if (!result.success && result.error instanceof ZodError) return zodErrorResponse(result.error, c);
    }),
    zValidator("json", updateLoanPlanSchema, (result, c) => {
        if (!result.success && result.error instanceof ZodError) return zodErrorResponse(result.error, c);
    }),
    async (c) => {
        const user = c.get("user");
        return updateLoanPlan(
            c,
            user.sub,
            c.req.valid("param").id,
            c.req.valid("json") as UpdateLoanPlanOutput
        );
    }
);

debtRouter.post(
    "/plans/:planId/pause",
    zValidator("param", uuidParamSchema, (result, c) => {
        if (!result.success && result.error instanceof ZodError) return zodErrorResponse(result.error, c);
    }),
    async (c) => {
        const user = c.get("user");
        return pauseLoanPlan(c, user.sub, c.req.valid("param").id);
    }
);

debtRouter.post(
    "/plans/:planId/resume",
    zValidator("param", uuidParamSchema, (result, c) => {
        if (!result.success && result.error instanceof ZodError) return zodErrorResponse(result.error, c);
    }),
    async (c) => {
        const user = c.get("user");
        return resumeLoanPlan(c, user.sub, c.req.valid("param").id);
    }
);

debtRouter.post(
    "/plans/:planId/cancel",
    zValidator("param", uuidParamSchema, (result, c) => {
        if (!result.success && result.error instanceof ZodError) return zodErrorResponse(result.error, c);
    }),
    zValidator("json", cancelLoanPlanSchema, (result, c) => {
        if (!result.success && result.error instanceof ZodError) return zodErrorResponse(result.error, c);
    }),
    async (c) => {
        const user = c.get("user");
        return cancelLoanPlan(
            c,
            user.sub,
            c.req.valid("param").id,
            c.req.valid("json") as CancelLoanPlanOutput
        );
    }
);

debtRouter.get("/installments", async (c) => {
    const user = c.get("user");
    const parsed = debtMonthQuerySchema.safeParse(c.req.query());
    if (!parsed.success) return zodErrorResponse(parsed.error, c);
    return listDebtInstallments(c, user.sub, parsed.data as DebtMonthQuery);
});

debtRouter.post(
    "/installments/:installmentId/pay",
    zValidator("param", uuidParamSchema, (result, c) => {
        if (!result.success && result.error instanceof ZodError) return zodErrorResponse(result.error, c);
    }),
    zValidator("json", payInstallmentSchema, (result, c) => {
        if (!result.success && result.error instanceof ZodError) return zodErrorResponse(result.error, c);
    }),
    async (c) => {
        const user = c.get("user");
        return payDebtInstallment(
            c,
            user.sub,
            c.req.valid("param").id,
            c.req.valid("json") as PayInstallmentOutput
        );
    }
);
