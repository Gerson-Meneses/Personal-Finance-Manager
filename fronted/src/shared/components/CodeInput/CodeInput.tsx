import { useRef } from "react";
import "./CodeInput.css";

interface CodeInputProps {
    value: string[];
    onChange: (value: string[]) => void;
    length?: number;
    error?: boolean;
    disabled?: boolean;
    autoFocus?: boolean;
    "aria-label"?: string;
}

export const CodeInput = ({
    value,
    onChange,
    length = 6,
    error = false,
    disabled = false,
    autoFocus = false,
    "aria-label": ariaLabel = "Código de verificación",
}: CodeInputProps) => {
    const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

    const setDigit = (index: number, char: string) => {
        const next = [...value];
        next[index] = char;
        onChange(next);
    };

    const handleDigitChange = (index: number, raw: string) => {
        const clean = raw.replace(/\D/g, "").slice(-1);
        setDigit(index, clean);
        if (clean && index < length - 1) {
            inputsRef.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace" && !value[index] && index > 0) {
            inputsRef.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
        if (!pasted) return;
        const next = Array(length).fill("");
        pasted.split("").forEach((char, i) => { next[i] = char });
        onChange(next);
        inputsRef.current[Math.min(pasted.length, length - 1)]?.focus();
    };

    return (
        <div className="code-inputs" onPaste={handlePaste} role="group" aria-label={ariaLabel}>
            {value.map((digit, i) => (
                <input
                    key={i}
                    ref={el => { inputsRef.current[i] = el }}
                    className={`code-input ${digit ? "filled" : ""} ${error ? "code-input-error" : ""}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    aria-label={`Dígito ${i + 1}`}
                    onChange={e => handleDigitChange(i, e.target.value)}
                    onKeyDown={e => handleKeyDown(i, e)}
                    onFocus={e => e.target.select()}
                    disabled={disabled}
                    autoFocus={autoFocus && i === 0}
                />
            ))}
        </div>
    );
};
