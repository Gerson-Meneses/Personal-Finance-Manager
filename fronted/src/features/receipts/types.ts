import type { ParsedReceipt } from "./parser";

export interface ReceiptScanResult extends ParsedReceipt {
    confidence: number;
    warning?: string;
}

export interface ReceiptScanProgress {
    status: string;
    progress: number;
}

export interface ReceiptScanOutput {
    /** Archivo que se adjuntará a la transacción. */
    file: File;
    result: ReceiptScanResult;
}

export const MAX_RECEIPT_INPUT_SIZE = 25 * 1024 * 1024;
