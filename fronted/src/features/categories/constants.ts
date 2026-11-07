export const TYPE_LABELS: Record<string, string> = {
    INCOME: "Ingreso",
    EXPENSE: "Gasto",
    TRANSFER: "Transferencia",
    CREDIT_PAYMENT: "Pago de tarjeta",
};

export const normalizeText = (text: string) =>
    text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
