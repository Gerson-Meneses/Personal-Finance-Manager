const MAX_DIMENSION = 1800;
const BRIGHT_THRESHOLD = 145;
const CONTRAST = 35;
const PAPER_THRESHOLD = 145;
const PADDING = 0.02;

const loadImage = (file: File): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const image = new Image();

        image.onload = () => {
            URL.revokeObjectURL(url);
            resolve(image);
        };
        image.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error("No se pudo leer la imagen"));
        };
        image.src = url;
    });

interface PaperBox {
    x: number;
    y: number;
    width: number;
    height: number;
}

/**
 * Busca el área blanca más grande de la foto (la boleta) para recortar el
 * fondo oscuro antes del OCR.
 */
const detectPaperBox = (
    context: CanvasRenderingContext2D,
    width: number,
    height: number
): PaperBox | null => {
    const { data } = context.getImageData(0, 0, width, height);
    let minX = width;
    let minY = height;
    let maxX = 0;
    let maxY = 0;
    let brightPixels = 0;

    const step = Math.max(1, Math.floor(Math.max(width, height) / 900));

    for (let y = 0; y < height; y += step) {
        for (let x = 0; x < width; x += step) {
            const index = (y * width + x) * 4;
            const gray =
                0.299 * data[index] +
                0.587 * data[index + 1] +
                0.114 * data[index + 2];

            if (gray < BRIGHT_THRESHOLD) continue;

            brightPixels += 1;
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
        }
    }

    if (brightPixels === 0) return null;

    const boxWidth = maxX - minX;
    const boxHeight = maxY - minY;

    if (boxWidth < width * 0.2 || boxHeight < height * 0.2) return null;
    if (boxWidth * boxHeight < width * height * 0.1) return null;

    const paddingX = Math.round(width * PADDING);
    const paddingY = Math.round(height * PADDING);

    return {
        x: Math.max(0, minX - paddingX),
        y: Math.max(0, minY - paddingY),
        width: Math.min(width, boxWidth + paddingX * 2),
        height: Math.min(height, boxHeight + paddingY * 2),
    };
};

/**
 * Prepara una versión de alto contraste para el OCR: detecta y recorta la
 * boleta, pasa a escala de grises y aplica contraste + umbral. La foto
 * original se conserva para adjuntarla a la transacción.
 */
export const preprocessReceiptImage = async (file: File): Promise<File> => {
    const image = await loadImage(file);

    const baseScale = Math.min(1, MAX_DIMENSION / Math.max(image.width, image.height));
    const baseWidth = Math.max(1, Math.round(image.width * baseScale));
    const baseHeight = Math.max(1, Math.round(image.height * baseScale));

    const baseCanvas = document.createElement("canvas");
    baseCanvas.width = baseWidth;
    baseCanvas.height = baseHeight;

    const baseContext = baseCanvas.getContext("2d", { willReadFrequently: true });
    if (!baseContext) return file;

    baseContext.drawImage(image, 0, 0, baseWidth, baseHeight);

    const paper = detectPaperBox(baseContext, baseWidth, baseHeight);

    const sx = paper?.x ?? Math.round(baseWidth * 0.04);
    const sy = paper?.y ?? Math.round(baseHeight * 0.02);
    const sw = paper?.width ?? Math.max(1, Math.round(baseWidth * 0.92));
    const sh = paper?.height ?? Math.max(1, Math.round(baseHeight * 0.96));

    const scale = Math.min(2.5, Math.max(1, MAX_DIMENSION / sw));
    const width = Math.round(sw * scale);
    const height = Math.round(sh * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return file;

    context.drawImage(baseCanvas, sx, sy, sw, sh, 0, 0, width, height);

    const imageData = context.getImageData(0, 0, width, height);
    const pixels = imageData.data;
    const factor = (259 * (CONTRAST + 255)) / (255 * (259 - CONTRAST));

    for (let index = 0; index < pixels.length; index += 4) {
        const gray =
            0.299 * pixels[index] +
            0.587 * pixels[index + 1] +
            0.114 * pixels[index + 2];
        const contrasted = factor * (gray - 128) + 128;
        const value = contrasted >= PAPER_THRESHOLD ? 255 : 0;

        pixels[index] = value;
        pixels[index + 1] = value;
        pixels[index + 2] = value;
    }

    context.putImageData(imageData, 0, 0);

    const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png")
    );
    if (!blob) return file;

    return new File([blob], "boleta-ocr.png", {
        type: "image/png",
        lastModified: Date.now(),
    });
};
