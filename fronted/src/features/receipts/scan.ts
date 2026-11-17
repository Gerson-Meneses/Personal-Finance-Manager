import { parseReceiptText } from "./parser";
import { recognizeReceiptImage } from "./ocr";
import { extractPdfText } from "./pdf";
import { prepareReceiptImage } from "./utils/prepareReceiptImage";
import { preprocessReceiptImage } from "./utils/preprocessReceiptImage";
import type { ReceiptScanOutput, ReceiptScanProgress, ReceiptScanResult } from "./types";

const isPdf = (file: File) =>
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

const buildResult = (
    text: string,
    confidence: number,
    warning?: string
): ReceiptScanResult => {
    const parsed = parseReceiptText(text);
    const finalWarning =
        warning ??
        (parsed.amount === null
            ? "No se detectó el monto total. Revisa la imagen o ingrésalo manualmente."
            : undefined);

    return {
        ...parsed,
        confidence,
        ...(finalWarning ? { warning: finalWarning } : {}),
    };
};

export const scanReceiptFile = async (
    file: File,
    onProgress?: (progress: ReceiptScanProgress) => void
): Promise<ReceiptScanOutput> => {
    if (isPdf(file)) {
        onProgress?.({ status: "Leyendo PDF", progress: 10 });

        const { text, pageImage } = await extractPdfText(file);

        if (text.replace(/\s/g, "").length >= 20) {
            onProgress?.({ status: "Extrayendo datos", progress: 90 });
            return {
                file,
                result: buildResult(text, 100),
            };
        }

        if (!pageImage) {
            onProgress?.({ status: "PDF sin texto", progress: 100 });
            return {
                file,
                result: buildResult(
                    text,
                    0,
                    "El PDF no contiene texto legible. Prueba con una foto de la boleta."
                ),
            };
        }

        const preparedPage = await preprocessReceiptImage(pageImage).catch(() => pageImage);
        const ocr = await recognizeReceiptImage(preparedPage, onProgress);
        return {
            file,
            result: buildResult(ocr.text, ocr.confidence),
        };
    }

    const prepared = await prepareReceiptImage(file);
    onProgress?.({ status: "Preparando imagen", progress: 5 });

    let ocrImage = await preprocessReceiptImage(prepared).catch(() => prepared);
    let ocr: { text: string; confidence: number };

    try {
        ocr = await recognizeReceiptImage(ocrImage, onProgress);
    } catch {
        ocrImage = prepared;
        ocr = await recognizeReceiptImage(prepared, onProgress);
    }

    let result = buildResult(ocr.text, ocr.confidence);

    // Si el preprocesado perdió el total o la fecha, reintentamos con la
    // imagen original y completamos solo los campos faltantes.
    if (result.amount === null || result.date === null) {
        onProgress?.({ status: "Reintentando lectura", progress: 0 });
        try {
            const retry = await recognizeReceiptImage(prepared, onProgress);
            const retryResult = buildResult(retry.text, retry.confidence);

            result = {
                ...result,
                amount: result.amount ?? retryResult.amount,
                date: result.date ?? retryResult.date,
                merchantName: result.merchantName ?? retryResult.merchantName,
                merchantAddress: result.merchantAddress ?? retryResult.merchantAddress,
                merchantRuc: result.merchantRuc ?? retryResult.merchantRuc,
                items: result.items.length > 0 ? result.items : retryResult.items,
                confidence: Math.max(result.confidence, retryResult.confidence),
            };

            if (result.amount === null) {
                result.warning =
                    "No se detectó el monto total. Revisa la imagen o ingrésalo manualmente.";
            } else {
                delete result.warning;
            }
        } catch {
            // Conservamos el primer resultado.
        }
    }

    return {
        file: prepared,
        result,
    };
};
