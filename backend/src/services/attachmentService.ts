import { AppDataSourceProd } from "../database/dataBaseDev";
import { Transaction } from "../entities/Transaction.entity";
import { TransactionAttachment } from "../entities/TransactionAttachment.entity";
import { BadRequestError, NotFoundError } from "../helpers/errors/domain.errors";
import { UuidSchema } from "../schemas/uuid.schema";
import { TransactionAttachmentResponse } from "../ResponseInterfaces/TransactionInterface";

export const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
    "text/csv",
    "application/zip",
    "application/json",
]);

export interface UploadedAttachmentFile {
    name: string;
    type: string;
    size: number;
    data: Buffer;
}

const isAllowedMimeType = (mimeType: string) =>
    mimeType.startsWith("image/") || ALLOWED_MIME_TYPES.has(mimeType);

const toAttachmentResponse = (
    attachment: TransactionAttachment
): TransactionAttachmentResponse => ({
    id: attachment.id,
    fileName: attachment.fileName,
    mimeType: attachment.mimeType,
    size: attachment.size,
    createdAt: attachment.createdAt,
});

export class AttachmentService {
    private attachmentRepo = AppDataSourceProd.getRepository(TransactionAttachment);
    private transactionRepo = AppDataSourceProd.getRepository(Transaction);

    private async assertTransactionOwnership(transactionId: UuidSchema, userId: UuidSchema) {
        const transaction = await this.transactionRepo.findOne({
            where: { id: transactionId, user: { id: userId } },
            select: ["id"],
        });
        if (!transaction) throw new NotFoundError("Transacción no encontrada");
        return transaction;
    }

    async uploadAttachment(
        transactionId: UuidSchema,
        userId: UuidSchema,
        file: UploadedAttachmentFile
    ): Promise<TransactionAttachmentResponse> {
        const transaction = await this.assertTransactionOwnership(transactionId, userId);

        if (!file.size) {
            throw new BadRequestError("El archivo está vacío.", { file: ["El archivo está vacío."] });
        }
        if (file.size > MAX_ATTACHMENT_SIZE) {
            throw new BadRequestError(
                `El archivo supera el límite de ${MAX_ATTACHMENT_SIZE / (1024 * 1024)} MB.`,
                { file: ["El archivo es demasiado grande."] }
            );
        }
        if (!isAllowedMimeType(file.type)) {
            throw new BadRequestError("Tipo de archivo no permitido.", {
                file: ["Solo se permiten imágenes, PDF, documentos de texto y hojas de cálculo."],
            });
        }

        const safeName = file.name.replace(/[\\/]/g, "_").slice(0, 255) || "adjunto";

        const attachment = this.attachmentRepo.create({
            fileName: safeName,
            mimeType: file.type,
            size: file.size,
            data: file.data,
            transaction,
            user: { id: userId } as TransactionAttachment["user"],
        });

        const saved = await this.attachmentRepo.save(attachment);
        return toAttachmentResponse(saved);
    }

    async listAttachments(
        transactionId: UuidSchema,
        userId: UuidSchema
    ): Promise<TransactionAttachmentResponse[]> {
        await this.assertTransactionOwnership(transactionId, userId);

        const attachments = await this.attachmentRepo.find({
            where: { transaction: { id: transactionId } },
            select: ["id", "fileName", "mimeType", "size", "createdAt"],
            order: { createdAt: "DESC" },
        });

        return attachments.map(toAttachmentResponse);
    }

    async getAttachmentFile(
        attachmentId: UuidSchema,
        userId: UuidSchema
    ): Promise<TransactionAttachment> {
        const attachment = await this.attachmentRepo.findOne({
            where: { id: attachmentId, user: { id: userId } },
        });
        if (!attachment) throw new NotFoundError("Adjunto no encontrado");
        return attachment;
    }

    async deleteAttachment(attachmentId: UuidSchema, userId: UuidSchema): Promise<void> {
        const attachment = await this.getAttachmentFile(attachmentId, userId);
        await this.attachmentRepo.remove(attachment);
    }
}
