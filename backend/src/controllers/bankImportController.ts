import type { Context } from "hono";
import { BankImportService } from "../services/bankImportService";
import type { UuidSchema } from "../schemas/uuid.schema";
import type {
    BankLinesQuery,
    CreateFromBankLineInput,
    ImportBankLinesOutput,
} from "../schemas/bankImport.schema";

const bankImportService = new BankImportService();

export const importBankLines = async (
    c: Context,
    userId: UuidSchema,
    data: ImportBankLinesOutput
) => {
    const result = await bankImportService.importLines(userId, data);
    return c.json(result, 201);
};

export const getBankLines = async (
    c: Context,
    userId: UuidSchema,
    query: BankLinesQuery
) => {
    const result = await bankImportService.getLines(userId, query);
    return c.json(result, 200);
};

export const matchBankLine = async (
    c: Context,
    userId: UuidSchema,
    lineId: string,
    transactionId: string
) => {
    const result = await bankImportService.matchLine(userId, lineId, transactionId);
    return c.json(result, 200);
};

export const createTransactionFromBankLine = async (
    c: Context,
    userId: UuidSchema,
    lineId: string,
    data: CreateFromBankLineInput
) => {
    const result = await bankImportService.createTransactionFromLine(
        userId,
        lineId,
        data
    );
    return c.json(result, 201);
};

export const ignoreBankLine = async (
    c: Context,
    userId: UuidSchema,
    lineId: string
) => {
    const result = await bankImportService.ignoreLine(userId, lineId);
    return c.json(result, 200);
};

export const restoreBankLine = async (
    c: Context,
    userId: UuidSchema,
    lineId: string
) => {
    const result = await bankImportService.restoreLine(userId, lineId);
    return c.json(result, 200);
};

export const unmatchBankLine = async (
    c: Context,
    userId: UuidSchema,
    lineId: string
) => {
    const result = await bankImportService.unmatchLine(userId, lineId);
    return c.json(result, 200);
};
