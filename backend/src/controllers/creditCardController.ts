import { Context } from "hono";
import { TransactionService } from "../services/transactionService";
import { CreditCardService, MAX_CREDIT_DOCUMENT_SIZE, type UploadedCreditDocument } from "../services/creditCardService";
import { BadRequestError } from "../helpers/errors/domain.errors";
import { UuidSchema } from "../schemas/uuid.schema";
import { CreditDocumentType } from "../utils/Enums";
import {
    ConfirmPendingSchema,
    CreateChargeSchema,
    CreateInstallmentPlanSchema,
    UpdateChargeSchema,
} from "../schemas/creditCard.schema";

const transactionService = new TransactionService();
const creditCardService = new CreditCardService();

type ParsedUploadedFile = UploadedCreditDocument & {
    arrayBuffer(): Promise<ArrayBuffer>;
};

const isUploadedFile = (value: unknown): value is ParsedUploadedFile => {
    if (typeof value !== "object" || value === null) return false;
    const candidate = value as Record<string, unknown>;
    return (
        typeof candidate.name === "string" &&
        typeof candidate.type === "string" &&
        typeof candidate.size === "number" &&
        typeof candidate.arrayBuffer === "function"
    );
};

export const makePayment = async (c: Context, userId: string, creditCardId: string, paymentData: any) => {
    const payment = await transactionService.makePayment(userId, creditCardId, paymentData);
    return c.json({ message: "Pago realizado con exito", payment, status: 201 });
};

export const getSummary = async (c: Context, userId: UuidSchema, accountId: UuidSchema) => {
    const summary = await creditCardService.getSummary(accountId, userId);
    return c.json(summary, 200);
};

export const confirmPending = async (
    c: Context,
    userId: UuidSchema,
    accountId: UuidSchema,
    transactionId: UuidSchema,
    payload: ConfirmPendingSchema
) => {
    const transaction = await creditCardService.confirmTransaction(userId, transactionId, payload);
    return c.json({ message: "Transaccion confirmada", transaction }, 200);
};

export const confirmAllPending = async (c: Context, userId: UuidSchema, accountId: UuidSchema) => {
    const result = await creditCardService.confirmAllPending(userId, accountId);
    return c.json({ message: "Transacciones pendientes confirmadas", ...result }, 200);
};

export const previewInstallmentPlan = async (
    c: Context,
    userId: UuidSchema,
    accountId: UuidSchema,
    payload: CreateInstallmentPlanSchema
) => {
    const preview = await creditCardService.previewInstallmentPlan(userId, accountId, payload);
    return c.json(preview, 200);
};

export const createInstallmentPlan = async (
    c: Context,
    userId: UuidSchema,
    accountId: UuidSchema,
    payload: CreateInstallmentPlanSchema
) => {
    const plan = await creditCardService.createInstallmentPlan(userId, accountId, payload);
    return c.json(plan, 201);
};

export const cancelInstallmentPlan = async (
    c: Context,
    userId: UuidSchema,
    accountId: UuidSchema,
    planId: UuidSchema
) => {
    await creditCardService.cancelInstallmentPlan(userId, accountId, planId);
    return c.body(null, 204);
};

export const createCharge = async (
    c: Context,
    userId: UuidSchema,
    accountId: UuidSchema,
    payload: CreateChargeSchema
) => {
    const charge = await creditCardService.createCharge(userId, accountId, payload);
    return c.json(charge, 201);
};

export const updateCharge = async (
    c: Context,
    userId: UuidSchema,
    accountId: UuidSchema,
    chargeId: UuidSchema,
    payload: UpdateChargeSchema
) => {
    const charge = await creditCardService.updateCharge(userId, accountId, chargeId, payload);
    return c.json(charge, 200);
};

export const deleteCharge = async (
    c: Context,
    userId: UuidSchema,
    accountId: UuidSchema,
    chargeId: UuidSchema
) => {
    await creditCardService.deleteCharge(userId, accountId, chargeId);
    return c.body(null, 204);
};

export const uploadDocument = async (
    c: Context,
    userId: UuidSchema,
    accountId: UuidSchema
) => {
    const body = await c.req.parseBody();
    const file = body["file"];

    if (!isUploadedFile(file)) {
        throw new BadRequestError("Archivo requerido.", { file: ["Envia un archivo en el campo 'file'."] });
    }
    if (file.size > MAX_CREDIT_DOCUMENT_SIZE) {
        throw new BadRequestError("El archivo es demasiado grande.", { file: ["Maximo 5 MB."] });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const typeValue = typeof body["type"] === "string" ? body["type"] : undefined;
    const type = (Object.values(CreditDocumentType) as string[]).includes(typeValue ?? "")
        ? (typeValue as CreditDocumentType)
        : CreditDocumentType.CONTRACT;

    let extractedData: Record<string, unknown> | null = null;
    if (typeof body["extractedData"] === "string" && body["extractedData"].trim()) {
        try {
            const parsed = JSON.parse(body["extractedData"]);
            if (parsed && typeof parsed === "object") {
                extractedData = parsed as Record<string, unknown>;
            }
        } catch {
            throw new BadRequestError("Los datos extraidos no son JSON valido.");
        }
    }

    const created = await creditCardService.uploadDocument(
        userId,
        accountId,
        {
            name: file.name,
            type: file.type || "application/octet-stream",
            size: buffer.byteLength,
            data: buffer,
        },
        type,
        extractedData
    );
    return c.json(created, 201);
};

export const listDocuments = async (c: Context, userId: UuidSchema, accountId: UuidSchema) => {
    const documents = await creditCardService.listDocuments(userId, accountId);
    return c.json(documents, 200);
};

export const downloadDocument = async (
    c: Context,
    userId: UuidSchema,
    accountId: UuidSchema,
    documentId: UuidSchema
) => {
    const document = await creditCardService.getDocumentFile(userId, accountId, documentId);
    const fallbackName = document.fileName.replace(/["\r\n]/g, "_");
    const encodedName = encodeURIComponent(document.fileName);

    return new Response(new Uint8Array(document.data), {
        status: 200,
        headers: {
            "Content-Type": document.mimeType,
            "Content-Length": String(document.size),
            "Content-Disposition": `attachment; filename="${fallbackName}"; filename*=UTF-8''${encodedName}`,
            "Cache-Control": "private, max-age=0, must-revalidate",
            "X-Content-Type-Options": "nosniff",
        },
    });
};

export const deleteDocument = async (
    c: Context,
    userId: UuidSchema,
    accountId: UuidSchema,
    documentId: UuidSchema
) => {
    await creditCardService.deleteDocument(userId, accountId, documentId);
    return c.body(null, 204);
};
