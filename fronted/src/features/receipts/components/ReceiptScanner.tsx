import { useRef, useState } from "react";
import dayjs from "dayjs";
import { Camera, FileText, Loader2, ScanLine, Upload } from "lucide-react";
import { CameraCapture } from "./CameraCapture";
import type { ReceiptScanProgress, ReceiptScanResult } from "../types";
import { formatCurrency } from "../../../shared/utils/formatCurrency";
import "./ReceiptScanner.css";

interface Props {
    disabled?: boolean;
    scanning: boolean;
    progress: ReceiptScanProgress | null;
    result: ReceiptScanResult | null;
    onFileSelected: (file: File) => void;
}

const isSupportedFile = (file: File) =>
    file.type === "application/pdf" || file.type.startsWith("image/");

export function ReceiptScanner({
    disabled,
    scanning,
    progress,
    result,
    onFileSelected,
}: Props) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [dragging, setDragging] = useState(false);
    const [cameraOpen, setCameraOpen] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);

    const pick = (file?: File | null) => {
        if (!file || disabled || scanning) return;
        if (!isSupportedFile(file)) {
            setLocalError("Solo se admiten imágenes (JPG, PNG, WEBP) o PDF.");
            return;
        }
        setLocalError(null);
        onFileSelected(file);
    };

    return (
        <div
            className={`receipt-scanner ${dragging ? "is-dragging" : ""} ${scanning ? "is-scanning" : ""}`}
            onDragOver={(event) => {
                event.preventDefault();
                if (!disabled && !scanning) setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                pick(event.dataTransfer.files?.[0]);
            }}
        >
            <div className="receipt-scanner__info">
                <span className="receipt-scanner__icon">
                    <ScanLine size={18} />
                </span>
                <div className="receipt-scanner__text">
                    <strong>Escanear boleta</strong>
                    <span>Arrastra una imagen o PDF, súbelo o toma una foto.</span>
                </div>
            </div>

            <div className="receipt-scanner__actions">
                <button
                    type="button"
                    className="receipt-scanner__btn"
                    onClick={() => setCameraOpen(true)}
                    disabled={disabled || scanning}
                >
                    <Camera size={14} />
                    Tomar foto
                </button>

                <button
                    type="button"
                    className="receipt-scanner__btn"
                    onClick={() => inputRef.current?.click()}
                    disabled={disabled || scanning}
                >
                    <Upload size={14} />
                    Subir archivo
                </button>

                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    hidden
                    disabled={disabled || scanning}
                    onChange={(event) => {
                        const file = event.target.files?.[0];
                        event.target.value = "";
                        pick(file);
                    }}
                />
            </div>

            {dragging && (
                <div className="receipt-scanner__drop">
                    <FileText size={20} />
                    Suelta la boleta aquí
                </div>
            )}

            {localError && (
                <span className="receipt-scanner__warning">{localError}</span>
            )}

            {scanning && progress && (
                <div className="receipt-scanner__progress">
                    <span>
                        <Loader2 size={13} className="receipt-scanner__spinner" />
                        {progress.status}… {progress.progress}%
                    </span>
                    <div className="receipt-scanner__bar">
                        <i style={{ width: `${Math.max(4, progress.progress)}%` }} />
                    </div>
                </div>
            )}

            {result && !scanning && (
                <div className="receipt-scanner__result">
                    {result.merchantName && (
                        <span
                            className="receipt-scanner__merchant tooltip-anchor tooltip-top tooltip-wide"
                            data-tooltip={result.merchantName}
                        >
                            {result.merchantName}
                        </span>
                    )}
                    {result.merchantAddress && (
                        <span
                            className="receipt-scanner__address tooltip-anchor tooltip-top tooltip-wide"
                            data-tooltip={result.merchantAddress}
                        >
                            {result.merchantAddress}
                        </span>
                    )}
                    {result.amount !== null && (
                        <span className="receipt-scanner__amount">
                            {formatCurrency(result.amount)}
                        </span>
                    )}
                    {result.date && (
                        <span>{dayjs(result.date).format("DD/MM/YYYY")}</span>
                    )}
                    {result.items.length > 0 && (
                        <span>{result.items.length} producto{result.items.length === 1 ? "" : "s"}</span>
                    )}
                    {result.confidence > 0 && (
                        <span className="receipt-scanner__confidence">
                            {result.confidence}% OCR
                        </span>
                    )}
                    {result.warning && (
                        <span className="receipt-scanner__warning">{result.warning}</span>
                    )}
                </div>
            )}

            <p className="receipt-scanner__hint">
                El OCR se ejecuta en tu navegador; la imagen de la boleta se guardará como adjunto.
            </p>

            <CameraCapture
                isOpen={cameraOpen}
                onClose={() => setCameraOpen(false)}
                onCapture={(file) => {
                    setCameraOpen(false);
                    pick(file);
                }}
            />
        </div>
    );
}
