import { createWorker, OEM, PSM, type Worker } from "tesseract.js";
import type { ReceiptScanProgress } from "./types";

let workerPromise: Promise<Worker> | null = null;
let queue: Promise<unknown> = Promise.resolve();
let progressHandler: ((progress: ReceiptScanProgress) => void) | null = null;

const getWorker = (): Promise<Worker> => {
    if (!workerPromise) {
        workerPromise = createWorker("spa", OEM.LSTM_ONLY, {
            logger: (message) => {
                if (message.status === "recognizing text") {
                    progressHandler?.({
                        status: "Reconociendo texto",
                        progress: Math.round(message.progress * 100),
                    });
                } else if (message.status.includes("loading language")) {
                    progressHandler?.({
                        status: "Cargando idioma",
                        progress: Math.round(message.progress * 100),
                    });
                }
            },
        })
            .then(async (worker) => {
                await worker.setParameters({
                    tessedit_pageseg_mode: PSM.AUTO,
                });
                return worker;
            })
            .catch((error) => {
                workerPromise = null;
                throw error;
            });
    }

    return workerPromise;
};

const runExclusive = async <T>(task: () => Promise<T>): Promise<T> => {
    const previous = queue;
    let release!: () => void;
    queue = new Promise<void>((resolve) => {
        release = resolve;
    });

    await previous;
    try {
        return await task();
    } finally {
        release();
    }
};

export const recognizeReceiptImage = async (
    image: File | Blob,
    onProgress?: (progress: ReceiptScanProgress) => void
): Promise<{ text: string; confidence: number }> => {
    return runExclusive(async () => {
        progressHandler = onProgress ?? null;
        onProgress?.({ status: "Iniciando OCR", progress: 0 });

        try {
            const worker = await getWorker();
            onProgress?.({ status: "Leyendo boleta", progress: 0 });
            const result = await worker.recognize(image);

            return {
                text: result.data.text ?? "",
                confidence: Math.round(result.data.confidence ?? 0),
            };
        } finally {
            progressHandler = null;
        }
    });
};

export const terminateOcrWorker = async (): Promise<void> => {
    if (!workerPromise) return;

    try {
        const worker = await workerPromise;
        await worker.terminate();
    } catch {
        // El worker pudo no haberse inicializado correctamente.
    } finally {
        workerPromise = null;
    }
};
