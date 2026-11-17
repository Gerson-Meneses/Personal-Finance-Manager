import { useMemo, useRef, useState } from "react";
import {
    ArrowDownLeft,
    ArrowUpRight,
    FileSpreadsheet,
    Upload,
} from "lucide-react";
import { FormContainer } from "../../../shared/components/FormContainer/FormContainer";
import { SelectInput } from "../../../shared/components/SelectInput/SelectInput";
import { formatCurrency } from "../../../shared/utils/formatCurrency";
import type { Account } from "../../accounts/types";
import type { ImportBankLinesInput } from "../types";
import {
    buildBankLines,
    detectMapping,
    parseCsv,
    type ColumnMapping,
    type DateFormat,
} from "../utils/csv";

interface Props {
    accounts: Account[];
    defaultAccountId?: string;
    isPending: boolean;
    error?: string | null;
    onSubmit: (data: ImportBankLinesInput) => Promise<void>;
    onClose: () => void;
}

const DATE_FORMATS: { value: DateFormat; label: string }[] = [
    { value: "auto", label: "Detectar automáticamente" },
    { value: "DD/MM/YYYY", label: "DD/MM/AAAA" },
    { value: "MM/DD/YYYY", label: "MM/DD/AAAA" },
    { value: "YYYY-MM-DD", label: "AAAA-MM-DD" },
];

const PREVIEW_ROWS = 8;

export function ImportBankWizard({
    accounts,
    defaultAccountId,
    isPending,
    error,
    onSubmit,
    onClose,
}: Props) {
    const [accountId, setAccountId] = useState(defaultAccountId ?? accounts[0]?.id ?? "");
    const [fileName, setFileName] = useState("");
    const [rows, setRows] = useState<string[][]>([]);
    const [delimiter, setDelimiter] = useState("");
    const [mapping, setMapping] = useState<ColumnMapping | null>(null);
    const [fileError, setFileError] = useState<string | null>(null);
    const [dragging, setDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const accountOptions = accounts.map((account) => ({
        value: account.id,
        label: account.name,
    }));

    const columnOptions = useMemo(() => {
        const headerRow = mapping?.hasHeader ? rows[0] ?? [] : [];
        const columnCount = rows.reduce(
            (max, row) => Math.max(max, row.length),
            0
        );

        return Array.from({ length: columnCount }, (_, index) => {
            const header = headerRow[index]?.trim();
            return {
                value: String(index),
                label: header
                    ? `${index + 1}. ${header}`
                    : `Columna ${index + 1}`,
            };
        });
    }, [rows, mapping]);

    const descriptionOptions = useMemo(
        () => [
            { value: "-1", label: "Sin descripción" },
            ...columnOptions,
        ],
        [columnOptions]
    );

    const result = useMemo(
        () => (mapping ? buildBankLines(rows, mapping) : null),
        [rows, mapping]
    );

    const updateMapping = (patch: Partial<ColumnMapping>) => {
        setMapping((current) => (current ? { ...current, ...patch } : current));
    };

    const readFile = async (file: File) => {
        setFileError(null);
        setFileName(file.name);
        setRows([]);
        setMapping(null);
        setDelimiter("");

        if (file.size > 10 * 1024 * 1024) {
            setFileError("El archivo supera los 10 MB. Divide el extracto en partes.");
            return;
        }

        try {
            const text = await file.text();
            const parsed = parseCsv(text);

            if (parsed.rows.length === 0) {
                setFileError("No se encontraron filas en el archivo.");
                return;
            }

            if (parsed.rows.every((row) => row.length < 2)) {
                setFileError(
                    "El archivo no parece un CSV válido. Verifica el separador."
                );
                return;
            }

            setRows(parsed.rows);
            setDelimiter(parsed.delimiter === "\t" ? "TAB" : parsed.delimiter);
            setMapping(detectMapping(parsed.rows));
        } catch {
            setFileError("No se pudo leer el archivo. Intenta con otro CSV.");
        }
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (
            !result ||
            result.lines.length === 0 ||
            result.lines.length > 1000 ||
            !accountId
        ) {
            return;
        }
        await onSubmit({ accountId, lines: result.lines });
    };

    const hasData = rows.length > 0 && mapping !== null;
    const previewLines = result?.lines.slice(0, PREVIEW_ROWS) ?? [];
    const hasErrors = (result?.errors.length ?? 0) > 0;
    const tooManyLines = (result?.lines.length ?? 0) > 1000;

    return (
        <FormContainer
            title="Importar extracto bancario"
            subtitle="Sube un CSV y revisa la vista previa antes de conciliar"
            icon={<Upload size={20} />}
            error={error ?? fileError}
            className="bank-import-wizard"
            onClose={onClose}
        >
            <form className="form-default-container bank-import-form" onSubmit={handleSubmit}>
                <div className="bi-field">
                    <SelectInput
                        label="Cuenta bancaria"
                        icon="Wallet"
                        value={accountId}
                        onChange={setAccountId}
                        options={accountOptions}
                        placeholder="Selecciona una cuenta"
                        required
                        disabled={isPending}
                        searchable={false}
                    />
                </div>

                <label
                    className={`bi-dropzone ${dragging ? "is-dragging" : ""}`}
                    onDragOver={(event) => {
                        event.preventDefault();
                        setDragging(true);
                    }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={(event) => {
                        event.preventDefault();
                        setDragging(false);
                        const file = event.dataTransfer.files?.[0];
                        if (file) void readFile(file);
                    }}
                >
                    <span className="bi-dropzone__icon">
                        <FileSpreadsheet size={22} />
                    </span>
                    <span className="bi-dropzone__text">
                        <strong>{fileName || "Selecciona o arrastra tu CSV"}</strong>
                        <small>
                            Exportado por tu banco · hasta 10 MB
                        </small>
                    </span>
                    <span className="btn-secondary bi-dropzone__button">
                        Elegir archivo
                    </span>
                    <input
                        ref={inputRef}
                        type="file"
                        accept=".csv,text/csv,text/plain,.txt"
                        className="bi-file-input"
                        onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) void readFile(file);
                            event.target.value = "";
                        }}
                        disabled={isPending}
                    />
                </label>

                {hasData && mapping && (
                    <>
                        <div className="bi-detected">
                            <span>
                                <strong>{rows.length - (mapping.hasHeader ? 1 : 0)}</strong> filas
                            </span>
                            <span>
                                Separador <strong>{delimiter || "—"}</strong>
                            </span>
                            <span>
                                {mapping.hasHeader ? "Con encabezados" : "Sin encabezados"}
                            </span>
                        </div>

                        <div className="bi-mapping">
                            <SelectInput
                                label="Columna de fecha"
                                icon="CalendarDays"
                                compact
                                value={String(mapping.dateColumn)}
                                onChange={(value) =>
                                    updateMapping({ dateColumn: Number(value) })
                                }
                                options={columnOptions}
                                searchable={false}
                                disabled={isPending}
                            />

                            <SelectInput
                                label="Descripción"
                                icon="AlignLeft"
                                compact
                                value={String(mapping.descriptionColumn)}
                                onChange={(value) =>
                                    updateMapping({ descriptionColumn: Number(value) })
                                }
                                options={descriptionOptions}
                                searchable={false}
                                disabled={isPending}
                            />

                            <div className="bi-mode">
                                <span className="bi-mode__label">Formato de monto</span>
                                <div className="bi-mode__toggle" role="group" aria-label="Formato de monto">
                                    <button
                                        type="button"
                                        className={mapping.amountMode === "single" ? "is-active" : ""}
                                        onClick={() =>
                                            updateMapping({
                                                amountMode: "single",
                                                amountColumn: Math.max(mapping.amountColumn, 0),
                                            })
                                        }
                                        disabled={isPending}
                                    >
                                        Monto único
                                    </button>
                                    <button
                                        type="button"
                                        className={mapping.amountMode === "debitCredit" ? "is-active" : ""}
                                        onClick={() =>
                                            updateMapping({
                                                amountMode: "debitCredit",
                                                debitColumn: Math.max(mapping.debitColumn, 0),
                                                creditColumn: Math.max(mapping.creditColumn, 0),
                                            })
                                        }
                                        disabled={isPending}
                                    >
                                        Cargo / abono
                                    </button>
                                </div>
                            </div>

                            {mapping.amountMode === "single" ? (
                                <SelectInput
                                    label="Columna de monto"
                                    icon="CircleDollarSign"
                                    compact
                                    value={String(mapping.amountColumn)}
                                    onChange={(value) =>
                                        updateMapping({ amountColumn: Number(value) })
                                    }
                                    options={columnOptions}
                                    searchable={false}
                                    disabled={isPending}
                                />
                            ) : (
                                <>
                                    <SelectInput
                                        label="Columna de cargos"
                                        icon="ArrowUpRight"
                                        compact
                                        value={String(mapping.debitColumn)}
                                        onChange={(value) =>
                                            updateMapping({ debitColumn: Number(value) })
                                        }
                                        options={columnOptions}
                                        searchable={false}
                                        disabled={isPending}
                                    />
                                    <SelectInput
                                        label="Columna de abonos"
                                        icon="ArrowDownLeft"
                                        compact
                                        value={String(mapping.creditColumn)}
                                        onChange={(value) =>
                                            updateMapping({ creditColumn: Number(value) })
                                        }
                                        options={columnOptions}
                                        searchable={false}
                                        disabled={isPending}
                                    />
                                </>
                            )}

                            <SelectInput
                                label="Formato de fecha"
                                icon="CalendarDays"
                                compact
                                value={mapping.dateFormat}
                                onChange={(value) =>
                                    updateMapping({ dateFormat: value as DateFormat })
                                }
                                options={DATE_FORMATS}
                                searchable={false}
                                disabled={isPending}
                            />
                        </div>

                        {result && (
                            <>
                                <div className="bi-summary">
                                    <span className="bi-chip is-valid">
                                        {result.lines.length} válidos
                                    </span>
                                    {hasErrors && (
                                        <span className="bi-chip is-error">
                                            {result.errors.length} con errores
                                        </span>
                                    )}
                                    <span className="bi-chip is-income">
                                        <ArrowDownLeft size={12} />
                                        {formatCurrency(result.incomeTotal)}
                                    </span>
                                    <span className="bi-chip is-expense">
                                        <ArrowUpRight size={12} />
                                        {formatCurrency(result.expenseTotal)}
                                    </span>
                                </div>

                                {tooManyLines && (
                                    <p className="bi-errors-note">
                                        El archivo supera los 1000 movimientos.
                                        Divide el extracto en partes más pequeñas.
                                    </p>
                                )}

                                {previewLines.length > 0 && (
                                    <div className="bi-preview">
                                        <span className="bi-preview__title">
                                            Vista previa
                                        </span>
                                        <div className="bi-preview__scroll">
                                            <table className="bi-preview__table">
                                                <thead>
                                                    <tr>
                                                        <th>Fecha</th>
                                                        <th>Descripción</th>
                                                        <th>Tipo</th>
                                                        <th>Monto</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {previewLines.map((line, index) => (
                                                        <tr key={`${line.date}-${index}`}>
                                                            <td>{line.date}</td>
                                                            <td className="bi-preview__desc">
                                                                {line.description}
                                                            </td>
                                                            <td>
                                                                <span
                                                                    className={`bi-type is-${line.type === "INCOME" ? "income" : "expense"}`}
                                                                >
                                                                    {line.type === "INCOME"
                                                                        ? "Ingreso"
                                                                        : "Gasto"}
                                                                </span>
                                                            </td>
                                                            <td className="amount-font">
                                                                {formatCurrency(line.amount)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {hasErrors && (
                                    <p className="bi-errors-note">
                                        Las filas con errores se omitirán automáticamente.
                                    </p>
                                )}
                            </>
                        )}
                    </>
                )}

                <div className="form-actions-container">
                    <button
                        type="button"
                        className="btn-secondary"
                        onClick={onClose}
                        disabled={isPending}
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="btn-submit"
                        disabled={
                            isPending ||
                            !accountId ||
                            !result ||
                            result.lines.length === 0 ||
                            tooManyLines
                        }
                    >
                        {isPending
                            ? "Importando..."
                            : `Importar ${result?.lines.length ?? 0} movimiento${result?.lines.length === 1 ? "" : "s"}`}
                    </button>
                </div>
            </form>
        </FormContainer>
    );
}
