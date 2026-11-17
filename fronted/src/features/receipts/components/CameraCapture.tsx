import { useEffect, useRef, useState } from "react";
import { Camera, Loader2, X } from "lucide-react";
import ModalPortal from "../../../shared/components/ModalPortal/ModalPortal";
import "./CameraCapture.css";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onCapture: (file: File) => void;
}

export function CameraCapture({ isOpen, onClose, onCapture }: Props) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [starting, setStarting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) return;

        let cancelled = false;
        setStarting(true);
        setError(null);

        const start = async () => {
            if (!navigator.mediaDevices?.getUserMedia) {
                setError("Tu navegador no permite acceder a la cámara.");
                setStarting(false);
                return;
            }

            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: { ideal: "environment" } },
                    audio: false,
                });

                if (cancelled) {
                    stream.getTracks().forEach((track) => track.stop());
                    return;
                }

                streamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    await videoRef.current.play();
                }
            } catch {
                if (!cancelled) {
                    setError(
                        "No se pudo acceder a la cámara. Revisa los permisos o sube una imagen."
                    );
                }
            } finally {
                if (!cancelled) setStarting(false);
            }
        };

        void start();

        return () => {
            cancelled = true;
            streamRef.current?.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        };
    }, [isOpen]);

    const capture = async () => {
        const video = videoRef.current;
        if (!video || !video.videoWidth || !video.videoHeight) return;

        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const context = canvas.getContext("2d");
        if (!context) return;

        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        const blob = await new Promise<Blob | null>((resolve) =>
            canvas.toBlob(resolve, "image/jpeg", 0.92)
        );
        if (!blob) return;

        onCapture(
            new File([blob], `boleta-${Date.now()}.jpg`, {
                type: "image/jpeg",
                lastModified: Date.now(),
            })
        );
        onClose();
    };

    return (
        <ModalPortal isOpen={isOpen} onClose={onClose}>
            <div className="camera-capture">
                <div className="camera-capture__head">
                    <h2>Tomar foto de la boleta</h2>
                    <button
                        type="button"
                        className="camera-capture__close"
                        onClick={onClose}
                        aria-label="Cerrar cámara"
                    >
                        <X size={18} />
                    </button>
                </div>

                {starting && (
                    <div className="camera-capture__status">
                        <Loader2 size={16} className="camera-capture__spinner" />
                        Iniciando cámara…
                    </div>
                )}

                {error && <div className="camera-capture__error">{error}</div>}

                {!error && (
                    <div className="camera-capture__video">
                        <video ref={videoRef} autoPlay playsInline muted />
                    </div>
                )}

                <div className="camera-capture__actions">
                    <button type="button" className="btn-secondary" onClick={onClose}>
                        Cancelar
                    </button>
                    <button
                        type="button"
                        className="btn-primary"
                        onClick={() => void capture()}
                        disabled={starting || !!error}
                    >
                        <Camera size={16} />
                        Capturar
                    </button>
                </div>
            </div>
        </ModalPortal>
    );
}
