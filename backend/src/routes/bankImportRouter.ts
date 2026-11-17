import { Hono } from "hono";
import { ZodError } from "zod";
import { zValidator } from "@hono/zod-validator";
import { AppEnv } from "../types";
import { zodErrorResponse } from "../helpers/zodErrorResponse";
import { uuidParamSchema } from "../schemas/uuid.schema";
import {
    bankLinesQuerySchema,
    createFromBankLineSchema,
    importBankLinesSchema,
    matchBankLineSchema,
    type BankLinesQuery,
    type CreateFromBankLineInput,
    type ImportBankLinesOutput,
} from "../schemas/bankImport.schema";
import {
    createTransactionFromBankLine,
    getBankLines,
    ignoreBankLine,
    importBankLines,
    matchBankLine,
    restoreBankLine,
    unmatchBankLine,
} from "../controllers/bankImportController";

export const bankImportRouter = new Hono<AppEnv>();

bankImportRouter.get("/lines", async (c) => {
    const userId = c.get("user").sub;
    const parsed = bankLinesQuerySchema.safeParse(c.req.query());
    if (!parsed.success) return zodErrorResponse(parsed.error, c);
    return await getBankLines(c, userId, parsed.data as BankLinesQuery);
});

bankImportRouter.post(
    "/import",
    zValidator("json", importBankLinesSchema, (result, c) => {
        if (!result.success && result.error instanceof ZodError) {
            return zodErrorResponse(result.error, c);
        }
    }),
    async (c) => {
        const userId = c.get("user").sub;
        return await importBankLines(
            c,
            userId,
            c.req.valid("json") as ImportBankLinesOutput
        );
    }
);

bankImportRouter.post(
    "/lines/:id/match",
    zValidator("param", uuidParamSchema, (result, c) => {
        if (!result.success && result.error instanceof ZodError) {
            return zodErrorResponse(result.error, c);
        }
    }),
    zValidator("json", matchBankLineSchema, (result, c) => {
        if (!result.success && result.error instanceof ZodError) {
            return zodErrorResponse(result.error, c);
        }
    }),
    async (c) => {
        const userId = c.get("user").sub;
        const lineId = c.req.valid("param").id;
        const { transactionId } = c.req.valid("json");
        return await matchBankLine(c, userId, lineId, transactionId);
    }
);

bankImportRouter.post(
    "/lines/:id/create",
    zValidator("param", uuidParamSchema, (result, c) => {
        if (!result.success && result.error instanceof ZodError) {
            return zodErrorResponse(result.error, c);
        }
    }),
    zValidator("json", createFromBankLineSchema, (result, c) => {
        if (!result.success && result.error instanceof ZodError) {
            return zodErrorResponse(result.error, c);
        }
    }),
    async (c) => {
        const userId = c.get("user").sub;
        const lineId = c.req.valid("param").id;
        return await createTransactionFromBankLine(
            c,
            userId,
            lineId,
            c.req.valid("json") as CreateFromBankLineInput
        );
    }
);

bankImportRouter.post(
    "/lines/:id/ignore",
    zValidator("param", uuidParamSchema, (result, c) => {
        if (!result.success && result.error instanceof ZodError) {
            return zodErrorResponse(result.error, c);
        }
    }),
    async (c) => {
        const userId = c.get("user").sub;
        return await ignoreBankLine(c, userId, c.req.valid("param").id);
    }
);

bankImportRouter.post(
    "/lines/:id/restore",
    zValidator("param", uuidParamSchema, (result, c) => {
        if (!result.success && result.error instanceof ZodError) {
            return zodErrorResponse(result.error, c);
        }
    }),
    async (c) => {
        const userId = c.get("user").sub;
        return await restoreBankLine(c, userId, c.req.valid("param").id);
    }
);

bankImportRouter.post(
    "/lines/:id/unmatch",
    zValidator("param", uuidParamSchema, (result, c) => {
        if (!result.success && result.error instanceof ZodError) {
            return zodErrorResponse(result.error, c);
        }
    }),
    async (c) => {
        const userId = c.get("user").sub;
        return await unmatchBankLine(c, userId, c.req.valid("param").id);
    }
);
