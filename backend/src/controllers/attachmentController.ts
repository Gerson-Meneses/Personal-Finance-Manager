import { Context } from "hono";
import { AttachmentService, MAX_ATTACHMENT_SIZE, type UploadedAttachmentFile } from "../services/attachmentService";
import { UuidSchema } from "../schemas/uuid.schema";
import { BadRequestError } from "../helpers/errors/domain.errors";
import { TransactionAttachmentResponse } from "../ResponseInterfaces/TransactionInterface";

const attachmentService = new AttachmentService();

type ParsedUploadedFile = UploadedAttachmentFile & {
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

export const uploadAttachment = async (
    c: Context,
    userId: UuidSchema,
    transactionId: UuidSchema
) => {
    const body = await c.req.parseBody();
    const file = body["file"];

    if (!isUploadedFile(file)) {
        throw new BadRequestError("Archivo requerido.", { file: ["Envía un archivo en el campo 'file'."] });
    }

    const uploaded = file as unknown as ParsedUploadedFile;
    const buffer = Buffer.from(await uploaded.arrayBuffer());

    const created = await attachmentService.uploadAttachment(transactionId, userId, {
        name: uploaded.name,
        type: uploaded.type || "application/octet-stream",
        size: buffer.byteLength,
        data: buffer,
    });

    return c.json<TransactionAttachmentResponse>(created, 201);
};

export const listAttachments = async (
    c: Context,
    userId: UuidSchema,
    transactionId: UuidSchema
) => {
    const attachments = await attachmentService.listAttachments(transactionId, userId);
    return c.json<TransactionAttachmentResponse[]>(attachments, 200);
};

export const downloadAttachment = async (
    c: Context,
    userId: UuidSchema,
    attachmentId: UuidSchema
) => {
    const attachment = await attachmentService.getAttachmentFile(attachmentId, userId);

    const fallbackName = attachment.fileName.replace(/["\r\n]/g, "_");
    const encodedName = encodeURIComponent(attachment.fileName);

    return new Response(new Uint8Array(attachment.data), {
        status: 200,
        headers: {
            "Content-Type": attachment.mimeType,
            "Content-Length": String(attachment.size),
            "Content-Disposition": `attachment; filename="${fallbackName}"; filename*=UTF-8''${encodedName}`,
            "Cache-Control": "private, max-age=0, must-revalidate",
            "X-Content-Type-Options": "nosniff",
            "X-Max-Attachment-Size": String(MAX_ATTACHMENT_SIZE),
        },
    });
};

export const deleteAttachment = async (
    c: Context,
    userId: UuidSchema,
    attachmentId: UuidSchema
) => {
    await attachmentService.deleteAttachment(attachmentId, userId);
    return c.body(null, 204);
};
