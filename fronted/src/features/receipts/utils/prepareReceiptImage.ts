const MAX_DIMENSION = 1800;
const JPEG_QUALITY = 0.88;

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

/**
 * Reduce la foto de la boleta antes de subirla. Esto acelera el OCR, evita
 * superar el límite del backend y mantiene el adjunto liviano.
 */
export const prepareReceiptImage = async (file: File): Promise<File> => {
    if (!file.type.startsWith("image/")) return file;
    if (file.type === "image/gif" || file.type === "image/svg+xml") return file;

    try {
        const image = await loadImage(file);
        const scale = Math.min(1, MAX_DIMENSION / Math.max(image.width, image.height));

        if (scale === 1 && file.size <= 1.5 * 1024 * 1024) return file;

        const width = Math.max(1, Math.round(image.width * scale));
        const height = Math.max(1, Math.round(image.height * scale));

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext("2d");
        if (!context) return file;

        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, width, height);
        context.drawImage(image, 0, 0, width, height);

        const blob = await new Promise<Blob | null>((resolve) =>
            canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY)
        );

        if (!blob || blob.size >= file.size) return file;

        const baseName = file.name.replace(/\.[^.]+$/, "") || "boleta";
        return new File([blob], `${baseName}.jpg`, {
            type: "image/jpeg",
            lastModified: Date.now(),
        });
    } catch {
        return file;
    }
};
