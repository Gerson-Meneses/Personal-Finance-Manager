import * as pdfjs from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import type {
    PDFDocumentProxy,
    TextItem,
} from "pdfjs-dist/types/src/display/api";

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export interface PdfExtractionResult {
    text: string;
    /** Imagen de la primera página cuando el PDF no tiene texto embebido. */
    pageImage: File | null;
}

const groupTextItemsIntoLines = (items: TextItem[]): string => {
    const lines: { y: number; items: { x: number; text: string }[] }[] = [];

    for (const item of items) {
        if (!item.str || !item.str.trim()) continue;

        const x = item.transform[4];
        const y = item.transform[5];
        let line = lines.find((candidate) => Math.abs(candidate.y - y) <= 2.5);

        if (!line) {
            line = { y, items: [] };
            lines.push(line);
        }

        line.items.push({ x, text: item.str });
    }

    lines.sort((a, b) => b.y - a.y);

    return lines
        .map((line) =>
            line.items
                .sort((a, b) => a.x - b.x)
                .map((item) => item.text)
                .join(" ")
                .replace(/\s+/g, " ")
                .trim()
        )
        .filter(Boolean)
        .join("\n");
};

const renderFirstPageToJpeg = async (
    pdfDocument: PDFDocumentProxy
): Promise<File | null> => {
    try {
        const page = await pdfDocument.getPage(1);
        const baseViewport = page.getViewport({ scale: 1 });
        const scale = Math.min(2.5, Math.max(1, 1800 / baseViewport.width));
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement("canvas");
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);

        const context = canvas.getContext("2d");
        if (!context) return null;

        await page.render({ canvas, viewport }).promise;

        const blob = await new Promise<Blob | null>((resolve) =>
            canvas.toBlob(resolve, "image/jpeg", 0.9)
        );
        if (!blob) return null;

        return new File([blob], "boleta-pdf.jpg", {
            type: "image/jpeg",
            lastModified: Date.now(),
        });
    } catch {
        return null;
    }
};

export const extractPdfText = async (file: File): Promise<PdfExtractionResult> => {
    const data = new Uint8Array(await file.arrayBuffer());
    const loadingTask = pdfjs.getDocument({
        data,
        useWorkerFetch: false,
    });
    const document = await loadingTask.promise;

    try {
        const page = await document.getPage(1);
        const content = await page.getTextContent();
        const textItems = content.items.filter(
            (item): item is TextItem => "str" in item
        );
        const text = groupTextItemsIntoLines(textItems);

        if (text.replace(/\s/g, "").length >= 20) {
            return { text, pageImage: null };
        }

        return {
            text,
            pageImage: await renderFirstPageToJpeg(document),
        };
    } finally {
        await loadingTask.destroy();
    }
};
