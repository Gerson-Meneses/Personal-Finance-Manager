import { useState, type ReactNode } from "react";
import ModalPortal from "../../../shared/components/ModalPortal/ModalPortal";
import { CodeInput } from "../../../shared/components/CodeInput/CodeInput";
import "./CodeFlowModal.css";

const CODE_LENGTH = 6;

interface MutationState {
    isPending: boolean;
    isError: boolean;
    error: unknown;
}

interface CodeFlowModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description: ReactNode;
    sendMutation: MutationState;
    confirmMutation: MutationState;
    onSend: (onSuccess?: () => void) => void;
    onConfirm: (code: string) => void;
    confirmLabel?: string;
    sendLabel?: string;
    extraFields?: ReactNode;
}

function extractErrorMessage(error: unknown): string | null {
    if (!error || typeof error !== "object") return null;
    const err = error as { message?: unknown; details?: unknown };
    const parts: string[] = [];
    if (typeof err.message === "string" && err.message.trim()) {
        parts.push(err.message);
    }
    if (err.details && typeof err.details === "object") {
        for (const value of Object.values(err.details as Record<string, unknown>)) {
            if (Array.isArray(value)) {
                parts.push(...value.filter((v): v is string => typeof v === "string"));
            } else if (typeof value === "string") {
                parts.push(value);
            }
        }
    }
    return parts.length ? parts.join(" · ") : null;
}

export function CodeFlowModal({
    isOpen,
    onClose,
    title,
    description,
    sendMutation,
    confirmMutation,
    onSend,
    onConfirm,
    confirmLabel = "Confirmar",
    sendLabel = "Enviar código",
    extraFields,
}: CodeFlowModalProps) {
    const [step, setStep] = useState<1 | 2>(1);
    const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));

    if (!isOpen) return null;

    const isCodeComplete = digits.every(d => d !== "");
    const sendError = extractErrorMessage(sendMutation.error);
    const confirmError = extractErrorMessage(confirmMutation.error);

    const handleSend = () => {
        onSend(() => setStep(2));
    };

    const handleConfirm = () => {
        onConfirm(digits.join(""));
    };

    return (
        <ModalPortal isOpen={isOpen} onClose={onClose}>
            <div className="codeflow-card">
                <h2 className="codeflow-title">{title}</h2>

                {step === 1 && (
                    <div className="codeflow-body">
                        <p className="codeflow-description">{description}</p>

                        {sendError && (
                            <div className="error-banner">{sendError}</div>
                        )}

                        <button
                            type="button"
                            className="codeflow-primary-btn"
                            onClick={handleSend}
                            disabled={sendMutation.isPending}
                        >
                            {sendMutation.isPending ? "Enviando..." : sendLabel}
                        </button>

                        <button type="button" className="codeflow-link-btn" onClick={onClose}>
                            Cancelar
                        </button>
                    </div>
                )}

                {step === 2 && (
                    <div className="codeflow-body">
                        <p className="codeflow-description">
                            Ingresa el código de 6 dígitos que enviamos a tu correo.
                        </p>

                        {extraFields}

                        <CodeInput
                            value={digits}
                            onChange={setDigits}
                            error={confirmMutation.isError}
                            disabled={confirmMutation.isPending}
                            autoFocus
                        />

                        {confirmError && (
                            <div className="error-banner">{confirmError}</div>
                        )}

                        <button
                            type="button"
                            className="codeflow-primary-btn"
                            onClick={handleConfirm}
                            disabled={!isCodeComplete || confirmMutation.isPending}
                        >
                            {confirmMutation.isPending ? "Verificando..." : confirmLabel}
                        </button>

                        <div className="codeflow-links">
                            <button
                                type="button"
                                className="codeflow-link-btn"
                                onClick={() => setStep(1)}
                                disabled={confirmMutation.isPending}
                            >
                                ← Volver
                            </button>
                            <button
                                type="button"
                                className="codeflow-link-btn"
                                onClick={handleSend}
                                disabled={sendMutation.isPending}
                            >
                                ¿No llegó? Reenviar código
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </ModalPortal>
    );
}
