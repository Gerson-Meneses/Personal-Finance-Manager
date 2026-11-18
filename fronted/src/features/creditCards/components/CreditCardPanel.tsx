import { useEffect, useMemo, useRef, useState } from "react";
import dayjs from "dayjs";
import {
    AlertTriangle,
    CheckCircle2,
    Clock3,
    CreditCard,
    Download,
    Eye,
    FileText,
    Loader2,
    Pencil,
    Plus,
    Repeat,
    ShieldCheck,
    Trash2,
    Upload,
    WalletCards,
} from "lucide-react";
import type { Account } from "../../accounts/types";
import { formatCurrency } from "../../../shared/utils/formatCurrency";
import { useToast } from "../../../shared/Hooks/useToast";
import { NumericInput } from "../../../shared/components/NumericInput/NumericInput";
import { TextInput } from "../../../shared/components/TextInput/TextInput";
import { SelectInput } from "../../../shared/components/SelectInput/SelectInput";
import ModalPortal from "../../../shared/components/ModalPortal/ModalPortal";
import { useCreditCardDocuments, useCreditCardSummary } from "../hooks";
import type {
    CreditCardCharge,
    CreditCardDocument,
    CreditCardPlan,
    CreditCardPlanPreview,
    CreditChargeType,
} from "../types";
import type { ContractExtraction } from "../contractParser";
import { scanContractFile } from "../contractParser";
import type { ReceiptScanProgress } from "../../receipts/types";
import * as service from "../services";
import "./creditCardPanel.css";

interface Props {
    account: Account;
    onApplyContract?: (fields: ContractExtraction) => Promise<void> | void;
}

const CHARGE_LABELS: Record<CreditChargeType, string> = {
    INSURANCE: "Seguro desgravamen",
    INTEREST: "Interés",
    FEE: "Comisión",
    OTHER: "Otro",
};

const formatDate = (value?: string) => (value ? dayjs(value).format("DD/MM/YYYY") : "—");

function SummaryMetric({ label, value, hint, tone }: {
    label: string;
    value: string;
    hint?: string;
    tone?: "danger" | "success" | "warning";
}) {
    return (
        <article className={`cc-metric ${tone ? `is-${tone}` : ""}`}>
            <span>{label}</span>
            <strong className="amount-font">{value}</strong>
            {hint && <small>{hint}</small>}
        </article>
    );
}

function PendingSection({
    summary,
    onConfirm,
    onConfirmAll,
    confirmingAll,
    confirmingId,
}: {
    summary: NonNullable<ReturnType<typeof useCreditCardSummary>["summary"]>;
    onConfirm: (id: string, amount?: number) => void;
    onConfirmAll: () => void;
    confirmingAll: boolean;
    confirmingId?: string;
}) {
    const [amounts, setAmounts] = useState<Record<string, string>>({});

    if (summary.pendingCount === 0) return null;

    return (
        <section className="cc-section cc-pending" id="compras-pendientes">
            <div className="cc-section-head">
                <div>
                    <h3>
                        <Clock3 size={17} />
                        Compras pendientes de confirmar
                        <span className="cc-chip">{summary.pendingCount}</span>
                    </h3>
                    <p className="text-muted">
                        {summary.pendingReadyCount > 0
                            ? `${summary.pendingReadyCount} ya deberían estar procesadas. Revisa el monto real y confirma.`
                            : "El comercio puede tardar hasta 24 horas en procesar el cargo."}
                    </p>
                </div>
                <button className="btn-primary btn-sm" onClick={onConfirmAll} disabled={confirmingAll}>
                    {confirmingAll ? <Loader2 size={14} className="spin" /> : <CheckCircle2 size={14} />}
                    Confirmar todas
                </button>
            </div>

            <div className="cc-pending-list">
                {summary.pending.map((item) => {
                    const value = amounts[item.id] ?? String(item.amount);
                    const parsed = Number(value);
                    return (
                        <div className="cc-pending-row" key={item.id}>
                            <div className="cc-pending-info">
                                <strong>{item.name}</strong>
                                <small>
                                    {formatDate(item.date)}
                                    {item.merchantName ? ` · ${item.merchantName}` : ""}
                                </small>
                                {item.authorizedAmount !== undefined && item.authorizedAmount !== item.amount && (
                                    <small className="cc-delta">
                                        Autorizado {formatCurrency(item.authorizedAmount)}
                                    </small>
                                )}
                            </div>
                            <div className="cc-pending-amount">
                                <NumericInput
                                    label="Monto real"                                    value={value}
                                    symbol="S/"
                                    onChange={(next) =>
                                        setAmounts((current) => ({ ...current, [item.id]: String(next) }))
                                    }
                                    disabled={confirmingId === item.id}
                                />
                            </div>
                            <button
                                className="btn-secondary btn-sm"
                                disabled={confirmingId === item.id || !Number.isFinite(parsed) || parsed <= 0}
                                onClick={() => onConfirm(item.id, parsed)}
                            >
                                {confirmingId === item.id ? <Loader2 size={14} className="spin" /> : <CheckCircle2 size={14} />}
                                Confirmar
                            </button>
                        </div>
                    );
                })}
            </div>

            {summary.merchantAdjustments.length > 0 && (
                <div className="cc-learning">
                    <ShieldCheck size={15} />
                    <div>
                        <strong>Aprendizaje por comercio</strong>
                        <p className="text-muted">
                            {summary.merchantAdjustments
                                .slice(0, 3)
                                .map(
                                    (item) =>
                                        `${item.merchantName}: +${formatCurrency(item.averageDelta)} (${item.averagePercent}%)`
                                )
                                .join(" · ")}
                        </p>
                    </div>
                </div>
            )}
        </section>
    );
}

function PlansSection({
    summary,
    onPreview,
    onCreate,
    onCancel,
    previewing,
    creating,
    cancellingId,
}: {
    summary: NonNullable<ReturnType<typeof useCreditCardSummary>["summary"]>;
    onPreview: (
        transactionIds: string[],
        installments: number,
        tea?: number
    ) => Promise<CreditCardPlanPreview | null>;
    onCreate: (transactionIds: string[], installments: number, tea?: number) => void;
    onCancel: (planId: string) => void;
    previewing: boolean;
    creating: boolean;
    cancellingId?: string;
}) {
    const [selected, setSelected] = useState<string[]>([]);
    const [installments, setInstallments] = useState("6");
    const [tea, setTea] = useState(summary.account.tea !== undefined ? String(summary.account.tea) : "");
    const [preview, setPreview] = useState<CreditCardPlanPreview | null>(null);
    const [planToRevert, setPlanToRevert] = useState<CreditCardPlan | null>(null);

    const toggle = (id: string) => {
        setSelected((current) =>
            current.includes(id) ? current.filter((value) => value !== id) : [...current, id]
        );
    };

    const selectedTotal = summary.eligiblePurchases
        .filter((purchase) => selected.includes(purchase.id))
        .reduce((sum, purchase) => sum + purchase.amount, 0);

    const normalizedInstallments = Math.max(
        2,
        Math.min(60, Math.round(Number(installments) || 0))
    );
    const teaValue = tea.trim() === "" ? undefined : Number(tea);

    const openPreview = async () => {
        const result = await onPreview(selected, normalizedInstallments, teaValue);
        if (result) setPreview(result);
    };

    return (
        <>
            <section className="cc-section">
                <div className="cc-section-head">
                    <div>
                        <h3><WalletCards size={17} /> Compras en cuotas</h3>
                        <p className="text-muted">
                            Solo se muestran compras confirmadas y sin pagos aplicados. El interés se calcula con la TEA.
                        </p>
                    </div>
                </div>

                {summary.plans.length > 0 && (
                    <div className="cc-plans">
                        {summary.plans.map((plan) => {
                            const paid = plan.installments.filter((item) => item.status === "PAID").length;
                            const next = plan.installments.find((item) => item.status !== "PAID" && item.status !== "CANCELLED");
                            return (
                                <article className="cc-plan" key={plan.id}>
                                    <div className="cc-plan-head">
                                        <div>
                                            <strong>{formatCurrency(plan.principal)} a {plan.installmentsCount} cuotas</strong>
                                            <small>
                                                TEA {plan.tea}% · Interés {formatCurrency(plan.totalInterest)} · Total {formatCurrency(plan.totalAmount)}
                                            </small>
                                        </div>
                                        <span className={`cc-badge is-${plan.status.toLowerCase()}`}>{plan.status}</span>
                                    </div>
                                    <div className="cc-plan-progress">
                                        <span style={{ width: `${plan.installmentsCount > 0 ? (paid / plan.installmentsCount) * 100 : 0}%` }} />
                                    </div>
                                    <div className="cc-plan-foot">
                                        <small>
                                            {paid} de {plan.installmentsCount} cuotas pagadas
                                            {next ? ` · Próxima: ${formatDate(next.dueDate)} por ${formatCurrency(next.total)}` : ""}
                                        </small>
                                        {plan.status === "ACTIVE" && next && (
                                            <button
                                                className="btn-icon btn-icon-delete"
                                                onClick={() => setPlanToRevert(plan)}
                                                disabled={cancellingId === plan.id}
                                                title="Revertir plan"
                                            >
                                                {cancellingId === plan.id ? <Loader2 size={14} className="spin" /> : <Trash2 size={14} />}
                                            </button>
                                        )}
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}

                <div className="cc-plan-builder">
                    <div className="cc-plan-purchases">
                        {summary.eligiblePurchases.length === 0 ? (
                            <p className="text-muted">
                                No hay compras confirmadas disponibles para convertir. Solo se pueden
                                financiar compras sin pagos aplicados.
                            </p>
                        ) : (
                            summary.eligiblePurchases.map((purchase) => (
                                <label className="cc-purchase-option" key={purchase.id}>
                                    <input
                                        type="checkbox"
                                        checked={selected.includes(purchase.id)}
                                        onChange={() => toggle(purchase.id)}
                                    />
                                    <span>
                                        <strong>{purchase.name}</strong>
                                        <small>
                                            {formatDate(purchase.date)}
                                            {purchase.merchantName ? ` · ${purchase.merchantName}` : ""}
                                        </small>
                                    </span>
                                    <b>{formatCurrency(purchase.amount)}</b>
                                </label>
                            ))
                        )}
                    </div>

                    <div className="cc-plan-controls">
                        <NumericInput
                            label="Cuotas"
                            value={installments}
                            icon="list"
                            symbol="#"
                            onChange={(value) => setInstallments(String(value))}
                            disabled={previewing || creating}
                        />
                        <NumericInput
                            label="TEA del plan"
                            value={tea}
                            icon="percent"
                            symbol="%"
                            onChange={(value) => setTea(String(value))}
                            disabled={previewing || creating}
                        />
                        <div className="cc-plan-total">
                            <span>Seleccionado</span>
                            <strong>{formatCurrency(selectedTotal)}</strong>
                        </div>
                        <button
                            className="btn-primary"
                            disabled={
                                previewing ||
                                creating ||
                                selected.length === 0 ||
                                normalizedInstallments < 2
                            }
                            onClick={() => void openPreview()}
                        >
                            {previewing ? <Loader2 size={15} className="spin" /> : <Eye size={15} />}
                            Vista previa
                        </button>
                    </div>
                </div>
            </section>

            <ModalPortal isOpen={!!preview} onClose={() => setPreview(null)}>
                {preview && (
                    <div
                        className="cc-modal card"
                    >
                        <div className="cc-modal-head">
                            <div>
                                <h2>Vista previa del plan</h2>
                                <p className="text-muted">
                                    Revisa el cronograma antes de confirmar. No se ha creado nada todavía.
                                </p>
                            </div>
                            <button className="btn-ghost" onClick={() => setPreview(null)}>
                                Cerrar
                            </button>
                        </div>

                        <div className="cc-preview-summary">
                            <div>
                                <span>Principal</span>
                                <strong>{formatCurrency(preview.principal)}</strong>
                            </div>
                            <div>
                                <span>Cuotas</span>
                                <strong>{preview.installmentsCount}</strong>
                            </div>
                            <div>
                                <span>TEA</span>
                                <strong>{preview.tea}%</strong>
                            </div>
                            <div>
                                <span>Interés total</span>
                                <strong>{formatCurrency(preview.totalInterest)}</strong>
                            </div>
                            <div>
                                <span>Total a pagar</span>
                                <strong>{formatCurrency(preview.totalAmount)}</strong>
                            </div>
                            <div>
                                <span>Primer vencimiento</span>
                                <strong>{formatDate(preview.firstDueDate)}</strong>
                            </div>
                        </div>

                        <div className="cc-preview-block">
                            <h3>Compras seleccionadas</h3>
                            <div className="cc-preview-list">
                                {preview.transactions.map((transaction) => (
                                    <div key={transaction.id}>
                                        <span>{transaction.name}</span>
                                        <small>{formatDate(transaction.date)}</small>
                                        <strong>{formatCurrency(transaction.amount)}</strong>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="cc-preview-block">
                            <h3>Cronograma</h3>
                            <div className="cc-preview-list">
                                {preview.installments.slice(0, 6).map((installment) => (
                                    <div key={installment.number}>
                                        <span>Cuota {installment.number}</span>
                                        <small>{formatDate(installment.dueDate)}</small>
                                        <strong>{formatCurrency(installment.total)}</strong>
                                    </div>
                                ))}
                            </div>
                            {preview.installments.length > 6 && (
                                <small className="text-muted">
                                    Se muestran las primeras 6 de {preview.installments.length} cuotas.
                                </small>
                            )}
                        </div>

                        <div className="cc-modal-actions">
                            <button className="btn-secondary" onClick={() => setPreview(null)}>
                                Volver
                            </button>
                            <button
                                className="btn-primary"
                                disabled={creating}
                                onClick={() => {
                                    onCreate(
                                        preview.transactions.map((transaction) => transaction.id),
                                        preview.installmentsCount,
                                        preview.tea
                                    );
                                    setPreview(null);
                                }}
                            >
                                {creating ? <Loader2 size={15} className="spin" /> : <CheckCircle2 size={15} />}
                                Confirmar plan
                            </button>
                        </div>
                    </div>
                )}
            </ModalPortal>

            <ModalPortal isOpen={!!planToRevert} onClose={() => setPlanToRevert(null)}>
                {planToRevert && (
                    <div
                        className="cc-modal card"
                    >
                        <div className="cc-modal-head">
                            <div>
                                <h2>Revertir plan de cuotas</h2>
                                <p className="text-muted">
                                    Esta acción deshace el plan y devuelve las compras a su estado anterior.
                                </p>
                            </div>
                            <button className="btn-ghost" onClick={() => setPlanToRevert(null)}>
                                Cerrar
                            </button>
                        </div>

                        <div className="cc-preview-summary">
                            <div>
                                <span>Principal</span>
                                <strong>{formatCurrency(planToRevert.principal)}</strong>
                            </div>
                            <div>
                                <span>Cuotas</span>
                                <strong>{planToRevert.installmentsCount}</strong>
                            </div>
                            <div>
                                <span>Interés</span>
                                <strong>{formatCurrency(planToRevert.totalInterest)}</strong>
                            </div>
                            <div>
                                <span>Total</span>
                                <strong>{formatCurrency(planToRevert.totalAmount)}</strong>
                            </div>
                        </div>

                        <p className="cc-warning">
                            <AlertTriangle size={14} />
                            Solo se puede revertir antes de que venza o se pague la primera cuota.
                        </p>

                        <div className="cc-modal-actions">
                            <button className="btn-secondary" onClick={() => setPlanToRevert(null)}>
                                Volver
                            </button>
                            <button
                                className="btn-danger"
                                disabled={cancellingId === planToRevert.id}
                                onClick={() => {
                                    onCancel(planToRevert.id);
                                    setPlanToRevert(null);
                                }}
                            >
                                {cancellingId === planToRevert.id ? (
                                    <Loader2 size={15} className="spin" />
                                ) : (
                                    <Trash2 size={15} />
                                )}
                                Revertir plan
                            </button>
                        </div>
                    </div>
                )}
            </ModalPortal>
        </>
    );
}


function ChargesSection({
    summary,
    onUpdate,
    onCreate,
    onDelete,
    updatingId,
    creating,
}: {
    summary: NonNullable<ReturnType<typeof useCreditCardSummary>["summary"]>;
    onUpdate: (chargeId: string, amount: number) => void;
    onCreate: (type: CreditChargeType, amount: number, description?: string) => void;
    onDelete: (chargeId: string) => void;
    updatingId?: string;
    creating: boolean;
}) {
    const [editing, setEditing] = useState<Record<string, string>>({});
    const [newType, setNewType] = useState<CreditChargeType>("FEE");
    const [newAmount, setNewAmount] = useState("");
    const [newDescription, setNewDescription] = useState("");

    return (
        <section className="cc-section">
            <div className="cc-section-head">
                <div>
                    <h3><ShieldCheck size={17} /> Seguros e intereses</h3>
                    <p className="text-muted">
                        El seguro de desgravamen es un cobro recurrente fijo por ciclo. Se calcula
                        automáticamente con la tasa configurada en la tarjeta y no se edita manualmente.
                        Si la tarjeta no tiene tasa, puedes agregar un seguro manual.
                    </p>
                </div>
            </div>

            {summary.charges.length === 0 ? (
                <p className="text-muted">Todavía no hay cargos generados.</p>
            ) : (
                <div className="cc-charges">
                    {summary.charges.map((charge: CreditCardCharge) => {
                        const value = editing[charge.id] ?? String(charge.amount);
                        return (
                            <div className="cc-charge-row" key={charge.id}>
                                <div className="cc-charge-info">
                                    <strong>{charge.description ?? CHARGE_LABELS[charge.type]}</strong>
                                    <small>
                                        {CHARGE_LABELS[charge.type]} · vence {formatDate(charge.dueDate)}
                                        {charge.source === "AUTO" ? " · automático" : ""}
                                    </small>
                                </div>
                                {charge.fixed ? (
                                    <div className="cc-charge-fixed">
                                        <strong>{formatCurrency(charge.amount)}</strong>
                                        <span className="cc-fixed-badge">
                                            <Repeat size={12} />
                                            Recurrente fijo
                                        </span>
                                    </div>
                                ) : (
                                    <div className="cc-charge-edit">
                                        <NumericInput
                                            label="Monto"
                                            value={value}
                                            symbol="S/"
                                            onChange={(next) =>
                                                setEditing((current) => ({ ...current, [charge.id]: String(next) }))
                                            }
                                            disabled={updatingId === charge.id}
                                        />
                                        <button
                                            className="btn-icon btn-icon-edit"
                                            disabled={updatingId === charge.id}
                                            onClick={() => onUpdate(charge.id, Number(value))}
                                            title="Guardar monto"
                                        >
                                            {updatingId === charge.id ? <Loader2 size={14} className="spin" /> : <Pencil size={14} />}
                                        </button>
                                        <button
                                            className="btn-icon btn-icon-delete"
                                            onClick={() => onDelete(charge.id)}
                                            title="Eliminar cargo"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="cc-charge-new">
                <SelectInput
                    label="Tipo"                    value={newType}
                    onChange={(value) => setNewType(value as CreditChargeType)}
                    options={Object.entries(CHARGE_LABELS).map(([value, label]) => ({ value, label }))}
                />
                <NumericInput
                    label="Monto"                    value={newAmount}
                    symbol="S/"
                    onChange={(value) => setNewAmount(String(value))}
                />
                <TextInput
                    label="Descripción"                    placeholder="Descripción del cargo"
                    value={newDescription}
                    onChange={setNewDescription}
                />
                <button
                    className="btn-secondary"
                    disabled={creating || !Number(newAmount)}
                    onClick={() => {
                        if (!Number(newAmount)) return;
                        onCreate(newType, Number(newAmount), newDescription || undefined);
                        setNewAmount("");
                        setNewDescription("");
                    }}
                >
                    {creating ? <Loader2 size={14} className="spin" /> : <Plus size={14} />}
                    Agregar
                </button>
            </div>
        </section>
    );
}

function DocumentsSection({
    accountId,
    documents,
    onApplyContract,
    uploadDocument,
    deleteDocument,
    uploading,
}: {
    accountId: string;
    documents: CreditCardDocument[];
    onApplyContract?: (fields: ContractExtraction) => Promise<void> | void;
    uploadDocument: (input: {
        file: File;
        type?: string;
        extractedData?: Record<string, unknown> | null;
    }) => Promise<unknown>;
    deleteDocument: (documentId: string) => void;
    uploading: boolean;
}) {
    const toast = useToast();
    const inputRef = useRef<HTMLInputElement>(null);
    const [scanning, setScanning] = useState(false);
    const [progress, setProgress] = useState<ReceiptScanProgress | null>(null);
    const [pendingFile, setPendingFile] = useState<File | null>(null);
    const [fields, setFields] = useState<ContractExtraction>({});
    const [confidence, setConfidence] = useState<number | null>(null);
    const [warning, setWarning] = useState<string | null>(null);

    const handleFile = async (file?: File) => {
        if (!file) return;
        setScanning(true);
        setWarning(null);
        setFields({});
        try {
            const { result } = await scanContractFile(file, setProgress);
            setPendingFile(file);
            setFields(result.fields);
            setConfidence(result.confidence);
            setWarning(result.warning ?? null);
        } catch {
            toast.error("No se pudo leer el documento");
            setPendingFile(file);
            setFields({});
            setConfidence(0);
            setWarning("No se pudo extraer texto. Puedes completar los datos manualmente.");
        } finally {
            setScanning(false);
            setProgress(null);
            if (inputRef.current) inputRef.current.value = "";
        }
    };

    const updateField = (key: keyof ContractExtraction, value: string) => {
        setFields((current) => ({
            ...current,
            [key]:
                key === "last4" || key === "issuer" || key === "brand" || key === "holderName"
                    ? value || undefined
                    : value === "" ? undefined : Number(value),
        }));
    };

    const save = async (apply: boolean) => {
        if (!pendingFile) return;
        try {
            if (apply && onApplyContract) {
                await onApplyContract(fields);
            }
            await uploadDocument({
                file: pendingFile,
                type: "CONTRACT",
                extractedData: fields as Record<string, unknown>,
            });
            toast.success(apply ? "Contrato guardado y datos aplicados" : "Contrato guardado");
            setPendingFile(null);
            setFields({});
            setConfidence(null);
            setWarning(null);
        } catch {
            toast.error("No se pudo guardar el contrato");
        }
    };

    return (
        <section className="cc-section">
            <div className="cc-section-head">
                <div>
                    <h3><FileText size={17} /> Contrato de la tarjeta</h3>
                    <p className="text-muted">
                        Sube el contrato en PDF o imagen. Extraeremos los datos y te pediremos confirmarlos antes de aplicarlos.
                    </p>
                </div>
                <button
                    className="btn-secondary btn-sm"
                    onClick={() => inputRef.current?.click()}
                    disabled={scanning || uploading}
                >
                    {scanning || uploading ? <Loader2 size={14} className="spin" /> : <Upload size={14} />}
                    Subir contrato
                </button>
                <input
                    ref={inputRef}
                    type="file"
                    accept="application/pdf,image/*"
                    hidden
                    onChange={(event) => void handleFile(event.target.files?.[0])}
                />
            </div>

            {scanning && (
                <div className="cc-scan-progress">
                    <Loader2 size={16} className="spin" />
                    <span>{progress?.status ?? "Leyendo documento"} {progress ? `${progress.progress}%` : ""}</span>
                </div>
            )}

            {pendingFile && !scanning && (
                <div className="cc-contract-preview">
                    <div className="cc-contract-preview-head">
                        <div>
                            <strong>{pendingFile.name}</strong>
                            <small>
                                {confidence !== null ? `Confianza de extracción: ${confidence}%` : "Revisa los datos"}
                            </small>
                        </div>
                        <button className="btn-icon" onClick={() => { setPendingFile(null); setFields({}); }}>
                            <Trash2 size={14} />
                        </button>
                    </div>
                    {warning && <p className="cc-warning"><AlertTriangle size={14} /> {warning}</p>}

                    <div className="cc-contract-grid">
                        <NumericInput label="Límite" value={fields.creditLimit !== undefined ? String(fields.creditLimit) : ""} symbol="S/" onChange={(v) => updateField("creditLimit", String(v))} />
                        <NumericInput label="Día de cierre" value={fields.billingCloseDay !== undefined ? String(fields.billingCloseDay) : ""} onChange={(v) => updateField("billingCloseDay", String(v))} />
                        <NumericInput label="Día de pago" value={fields.paymentDueDay !== undefined ? String(fields.paymentDueDay) : ""} onChange={(v) => updateField("paymentDueDay", String(v))} />
                        <NumericInput label="TEA" value={fields.tea !== undefined ? String(fields.tea) : ""} symbol="%" onChange={(v) => updateField("tea", String(v))} />
                        <NumericInput label="TCEA" value={fields.tcea !== undefined ? String(fields.tcea) : ""} symbol="%" onChange={(v) => updateField("tcea", String(v))} />
                        <NumericInput label="Desgravamen" value={fields.desgravamenRate !== undefined ? String(fields.desgravamenRate) : ""} symbol="%" onChange={(v) => updateField("desgravamenRate", String(v))} />
                        <NumericInput label="Tope del seguro" value={fields.desgravamenMaxAmount !== undefined ? String(fields.desgravamenMaxAmount) : ""} symbol="S/" onChange={(v) => updateField("desgravamenMaxAmount", String(v))} />
                        <TextInput label="Últimos 4" value={fields.last4 ?? ""} onChange={(v) => updateField("last4", v)} />
                        <TextInput label="Banco" value={fields.issuer ?? ""} onChange={(v) => updateField("issuer", v)} />
                        <TextInput label="Marca" value={fields.brand ?? ""} onChange={(v) => updateField("brand", v)} />
                        <TextInput label="Titular" value={fields.holderName ?? ""} onChange={(v) => updateField("holderName", v)} />
                    </div>

                    <div className="cc-contract-actions">
                        <button className="btn-secondary" onClick={() => void save(false)} disabled={uploading}>
                            Solo guardar contrato
                        </button>
                        <button className="btn-primary" onClick={() => void save(true)} disabled={uploading || !onApplyContract}>
                            {uploading ? <Loader2 size={14} className="spin" /> : <CheckCircle2 size={14} />}
                            Guardar y aplicar datos
                        </button>
                    </div>
                </div>
            )}

            {documents.length > 0 && (
                <div className="cc-documents">
                    {documents.map((document) => (
                        <div className="cc-document-row" key={document.id}>
                            <FileText size={16} />
                            <div>
                                <strong>{document.fileName}</strong>
                                <small>{document.type} · {Math.round(document.size / 1024)} KB</small>
                            </div>
                            <button
                                className="btn-icon btn-icon-edit"
                                title="Descargar"
                                onClick={() => void service.downloadDocument(accountId, document)}
                            >
                                <Download size={14} />
                            </button>
                            <button
                                className="btn-icon btn-icon-delete"
                                title="Eliminar"
                                onClick={() => deleteDocument(document.id)}
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}

export default function CreditCardPanel({ account, onApplyContract }: Props) {
    const toast = useToast();
    const {
        summary,
        loading,
        error,
        confirmPending,
        confirmAllPending,
        previewInstallmentPlan,
        createInstallmentPlan,
        cancelInstallmentPlan,
        createCharge,
        updateCharge,
        deleteCharge,
    } = useCreditCardSummary(account.id);
    const {
        documents,
        uploadDocument,
        deleteDocument,
    } = useCreditCardDocuments(account.id);

    const current = summary?.currentStatement;
    const next = summary?.nextStatement;
    const cycles = useMemo(() => summary?.cycles ?? [], [summary]);
    const scrolledToPending = useRef(false);

    useEffect(() => {
        if (!summary || scrolledToPending.current) return;
        if (window.location.hash !== "#compras-pendientes") return;
        scrolledToPending.current = true;
        document.getElementById("compras-pendientes")?.scrollIntoView({
            behavior: "smooth",
            block: "start",
        });
    }, [summary]);

    if (loading) {
        return (
            <section className="cc-panel card">
                <div className="cc-loading"><Loader2 size={18} className="spin" /> Calculando tu tarjeta...</div>
            </section>
        );
    }

    if (error || !summary) {
        return (
            <section className="cc-panel card">
                <p className="text-muted">No se pudo cargar el resumen de la tarjeta.</p>
            </section>
        );
    }

    return (
        <section className="cc-panel card">
            <header className="cc-panel-head">
                <div>
                    <span className="cc-eyebrow"><CreditCard size={15} /> Tarjeta de crédito</span>
                    <h2>{summary.account.name}</h2>
                    <p className="text-muted">
                        Corte día {summary.account.billingCloseDay} · Pago día {summary.account.paymentDueDay}
                        {summary.account.brand ? ` · ${summary.account.brand}` : ""}
                        {summary.account.last4 ? ` · •••• ${summary.account.last4}` : ""}
                    </p>
                </div>
                <div className="cc-panel-badges">
                    {summary.pendingCount > 0 && (
                        <span className="cc-chip cc-chip-warning">
                            <Clock3 size={13} /> {summary.pendingCount} pendientes
                        </span>
                    )}
                    {summary.overdueDebt > 0 && (
                        <span className="cc-chip cc-chip-danger">
                            <AlertTriangle size={13} /> Vencido
                        </span>
                    )}
                </div>
            </header>

            <div className="cc-metrics">
                <SummaryMetric
                    label="Deuda total"
                    value={formatCurrency(summary.totalDebt)}
                    hint={`${summary.usagePercent}% de ${formatCurrency(summary.maxCredit)}`}
                    tone={summary.usagePercent >= 80 ? "danger" : undefined}
                />
                <SummaryMetric
                    label="Facturado pendiente"
                    value={formatCurrency(summary.billedDebt)}
                    hint={summary.overdueDebt > 0 ? `${formatCurrency(summary.overdueDebt)} vencido` : "Listo para pagar"}
                    tone={summary.overdueDebt > 0 ? "danger" : undefined}
                />
                <SummaryMetric
                    label="No facturado"
                    value={formatCurrency(summary.unbilledDebt)}
                    hint="Compras del próximo ciclo"
                />
                <SummaryMetric
                    label="Disponible"
                    value={formatCurrency(summary.availableCredit)}
                    hint={summary.insuranceEstimate > 0 ? `Seguro estimado: ${formatCurrency(summary.insuranceEstimate)}` : undefined}
                    tone={summary.availableCredit < 0 ? "danger" : "success"}
                />
            </div>

            <div className="cc-statements">
                <article className="cc-statement">
                    <span>Factura actual</span>
                    {current ? (
                        <>
                            <strong className="amount-font">{formatCurrency(current.total)}</strong>
                            <small>
                                Cierre {formatDate(current.closingDate)} · Vence {formatDate(current.dueDate)}
                            </small>
                            <div className="cc-statement-bar">
                                <span style={{ width: `${current.total > 0 ? Math.min(100, (current.paid / current.total) * 100) : 0}%` }} />
                            </div>
                            <small>Pagado {formatCurrency(current.paid)} · Resta {formatCurrency(current.remaining)}</small>
                        </>
                    ) : (
                        <small>Sin movimientos facturados todavía.</small>
                    )}
                </article>
                <article className="cc-statement">
                    <span>Próximo ciclo</span>
                    {next ? (
                        <>
                            <strong className="amount-font">{formatCurrency(next.total)}</strong>
                            <small>
                                Cierre {formatDate(next.closingDate)} · Vence {formatDate(next.dueDate)}
                            </small>
                            <small>
                                Compras {formatCurrency(next.purchases)} · Cuotas {formatCurrency(next.installmentsPrincipal)} · Cargos {formatCurrency(next.charges)}
                            </small>
                        </>
                    ) : (
                        <small>Sin compras en el ciclo abierto.</small>
                    )}
                </article>
                <article className="cc-statement">
                    <span>Próximo pago</span>
                    <strong className="amount-font">{formatCurrency(summary.nextDueAmount)}</strong>
                    <small>{summary.nextDueDate ? `Vence ${formatDate(summary.nextDueDate)}` : "Sin fecha pendiente"}</small>
                    <small>{summary.cycleExpenses > 0 ? `Gastos del ciclo: ${formatCurrency(summary.cycleExpenses)}` : ""}</small>
                </article>
            </div>

            <PendingSection
                summary={summary}
                confirmingAll={confirmAllPending.isPending}
                confirmingId={confirmPending.variables?.transactionId}
                onConfirm={(id, amount) =>
                    confirmPending.mutate(
                        { transactionId: id, ...(amount !== undefined ? { amount } : {}) },
                        {
                            onSuccess: () => toast.success("Compra confirmada"),
                            onError: (err) => toast.error(err.message || "No se pudo confirmar"),
                        }
                    )
                }
                onConfirmAll={() =>
                    confirmAllPending.mutate(undefined, {
                        onSuccess: (result) => toast.success(`${result.confirmed} compras confirmadas`),
                        onError: (err) => toast.error(err.message || "No se pudieron confirmar"),
                    })
                }
            />

            <PlansSection
                summary={summary}
                previewing={previewInstallmentPlan.isPending}
                creating={createInstallmentPlan.isPending}
                cancellingId={cancelInstallmentPlan.variables}
                onPreview={async (transactionIds, installments, tea) => {
                    try {
                        return await previewInstallmentPlan.mutateAsync({
                            transactionIds,
                            installments,
                            ...(tea !== undefined ? { tea } : {}),
                        });
                    } catch (err) {
                        toast.error(
                            err instanceof Error ? err.message : "No se pudo generar la vista previa"
                        );
                        return null;
                    }
                }}
                onCreate={(transactionIds, installments, tea) =>
                    createInstallmentPlan.mutate(
                        { transactionIds, installments, ...(tea !== undefined ? { tea } : {}) },
                        {
                            onSuccess: () => toast.success("Plan de cuotas creado"),
                            onError: (err) => toast.error(err.message || "No se pudo crear el plan"),
                        }
                    )
                }
                onCancel={(planId) =>
                    cancelInstallmentPlan.mutate(planId, {
                        onSuccess: () => toast.success("Plan cancelado"),
                        onError: (err) => toast.error(err.message || "No se pudo cancelar"),
                    })
                }
            />

            <ChargesSection
                summary={summary}
                creating={createCharge.isPending}
                updatingId={updateCharge.variables?.chargeId}
                onCreate={(type, amount, description) =>
                    createCharge.mutate(
                        { type, amount, ...(description ? { description } : {}) },
                        {
                            onSuccess: () => toast.success("Cargo agregado"),
                            onError: (err) => toast.error(err.message || "No se pudo agregar"),
                        }
                    )
                }
                onUpdate={(chargeId, amount) =>
                    updateCharge.mutate(
                        { chargeId, data: { amount } },
                        {
                            onSuccess: () => toast.success("Cargo actualizado"),
                            onError: (err) => toast.error(err.message || "No se pudo actualizar"),
                        }
                    )
                }
                onDelete={(chargeId) =>
                    deleteCharge.mutate(chargeId, {
                        onSuccess: () => toast.success("Cargo eliminado"),
                        onError: (err) => toast.error(err.message || "No se pudo eliminar"),
                    })
                }
            />

            <DocumentsSection
                accountId={account.id}
                documents={documents}
                onApplyContract={onApplyContract}
                uploadDocument={uploadDocument.mutateAsync}
                deleteDocument={(id) =>
                    deleteDocument.mutate(id, {
                        onError: (err) => toast.error(err.message || "No se pudo eliminar"),
                    })
                }
                uploading={uploadDocument.isPending}
            />

            {cycles.length > 1 && (
                <section className="cc-section">
                    <div className="cc-section-head">
                        <h3>Historial de ciclos</h3>
                    </div>
                    <div className="cc-cycles">
                        {cycles.map((cycle) => (
                            <div className="cc-cycle-row" key={cycle.closingDate}>
                                <span>{cycle.periodKey}</span>
                                <small>Cierre {formatDate(cycle.closingDate)} · Vence {formatDate(cycle.dueDate)}</small>
                                <strong>{formatCurrency(cycle.total)}</strong>
                                <span className={`cc-badge is-${cycle.status.toLowerCase()}`}>{cycle.status}</span>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </section>
    );
}


