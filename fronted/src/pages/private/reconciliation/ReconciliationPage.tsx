import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    ArrowDownToLine,
    CheckCircle2,
    Clock,
    EyeOff,
    Landmark,
    RefreshCw,
    Upload,
} from "lucide-react";
import LoadingScreen from "../../../shared/components/LoadingScreen/LoadingScreen";
import ModalPortal from "../../../shared/components/ModalPortal/ModalPortal";
import { SearchInput } from "../../../shared/components/SearchInput/SearchInput";
import { SelectInput } from "../../../shared/components/SelectInput/SelectInput";
import { useToast } from "../../../shared/Hooks/useToast";
import { useAccounts } from "../../../features/accounts/hooks";
import { useCategories } from "../../../features/categories/hooks";
import { useBankImport, useBankLines } from "../../../features/bankImport/hooks";
import { ImportBankWizard } from "../../../features/bankImport/components/ImportBankWizard";
import { ReconcileLineCard } from "../../../features/bankImport/components/ReconcileLineCard";
import { CreateFromBankLineModal } from "../../../features/bankImport/components/CreateFromBankLineModal";
import type {
    BankLineStatus,
    BankLinesQuery,
    BankStatementLine,
    CreateFromBankLineInput,
} from "../../../features/bankImport/types";
import "./ReconciliationPage.css";

type StatusFilter = "ALL" | BankLineStatus;

const normalize = (value: string) =>
    value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();

export default function ReconciliationPage() {
    const navigate = useNavigate();
    const toast = useToast();

    const { accounts, loading: accountsLoading } = useAccounts();
    const { categories } = useCategories();
    const {
        importBankLines,
        matchLine,
        createFromLine,
        ignoreLine,
        restoreLine,
        unmatchLine,
    } = useBankImport();

    const [accountId, setAccountId] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("PENDING");
    const [search, setSearch] = useState("");
    const [importOpen, setImportOpen] = useState(false);
    const [creatingLine, setCreatingLine] = useState<BankStatementLine | null>(null);
    const [busyLineId, setBusyLineId] = useState<string | null>(null);

    const query = useMemo<BankLinesQuery>(
        () => ({
            accountId: accountId || undefined,
            status: statusFilter === "ALL" ? undefined : statusFilter,
            limit: 300,
        }),
        [accountId, statusFilter]
    );

    const linesQuery = useBankLines(query);
    const { data, isLoading, error, refetch, isFetching } = linesQuery;
    const summary = linesQuery.data?.summary ?? {
        pending: 0,
        matched: 0,
        imported: 0,
        ignored: 0,
        total: 0,
    };

    const visible = useMemo(() => {
        const source = linesQuery.data?.lines ?? [];
        const term = normalize(search.trim());
        if (!term) return source;
        return source.filter((line) =>
            normalize(line.description).includes(term)
        );
    }, [linesQuery.data, search]);

    const accountOptions = useMemo(
        () => [
            { value: "", label: "Todas las cuentas" },
            ...accounts.map((account) => ({
                value: account.id,
                label: account.name,
            })),
        ],
        [accounts]
    );

    const statusOptions: { value: StatusFilter; label: string; count: number }[] = [
        { value: "PENDING", label: "Pendientes", count: summary.pending },
        { value: "ALL", label: "Todos", count: summary.total },
        { value: "MATCHED", label: "Conciliados", count: summary.matched },
        { value: "IMPORTED", label: "Importados", count: summary.imported },
        { value: "IGNORED", label: "Ignorados", count: summary.ignored },
    ];

    const handleImport = async (input: Parameters<typeof importBankLines.mutateAsync>[0]) => {
        try {
            const result = await importBankLines.mutateAsync(input);
            const duplicateText = result.duplicates > 0
                ? ` · ${result.duplicates} duplicado${result.duplicates === 1 ? "" : "s"}`
                : "";
            toast.success(
                result.imported > 0
                    ? `${result.imported} movimiento${result.imported === 1 ? "" : "s"} importado${result.imported === 1 ? "" : "s"}${duplicateText}`
                    : `No hay movimientos nuevos${duplicateText}`
            );
            setImportOpen(false);
            setStatusFilter("PENDING");
            setAccountId(input.accountId);
            void refetch();
        } catch (requestError) {
            toast.error(
                requestError instanceof Error
                    ? requestError.message
                    : "No se pudo importar el extracto"
            );
        }
    };

    const handleMatch = (line: BankStatementLine, transactionId: string) => {
        setBusyLineId(line.id);
        matchLine.mutate(
            { lineId: line.id, transactionId },
            {
                onSuccess: () => toast.success("Movimiento conciliado"),
                onError: (mutationError) =>
                    toast.error(
                        mutationError instanceof Error
                            ? mutationError.message
                            : "No se pudo conciliar el movimiento"
                    ),
                onSettled: () => setBusyLineId(null),
            }
        );
    };

    const handleCreate = async (input: CreateFromBankLineInput) => {
        if (!creatingLine) return;
        try {
            await createFromLine.mutateAsync({
                lineId: creatingLine.id,
                data: input,
            });
            toast.success("Transacción creada y conciliada");
            setCreatingLine(null);
        } catch (requestError) {
            toast.error(
                requestError instanceof Error
                    ? requestError.message
                    : "No se pudo crear la transacción"
            );
        }
    };

    const runLineAction = (
        mutation: typeof ignoreLine | typeof restoreLine | typeof unmatchLine,
        line: BankStatementLine,
        successMessage: string
    ) => {
        setBusyLineId(line.id);
        mutation.mutate(line.id, {
            onSuccess: () => toast.success(successMessage),
            onError: (mutationError) =>
                toast.error(
                    mutationError instanceof Error
                        ? mutationError.message
                        : "No se pudo actualizar el movimiento"
                ),
            onSettled: () => setBusyLineId(null),
        });
    };

    if (accountsLoading && accounts.length === 0) {
        return <LoadingScreen message="Cargando cuentas..." />;
    }

    if (isLoading && !data) {
        return <LoadingScreen message="Cargando conciliación..." />;
    }

    if (error && !data) {
        return (
            <div className="page-container">
                <div className="empty-state card">
                    <p className="text-muted">
                        {error instanceof Error
                            ? error.message
                            : "No se pudo cargar la conciliación."}
                    </p>
                    <button className="btn-primary" onClick={() => refetch()}>
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    const noAccounts = accounts.length === 0;
    const importDisabled = noAccounts || importBankLines.isPending;

    return (
        <div className="page-container reconciliation-page">
            <header className="reconciliation-header card">
                <div className="reconciliation-header__text">
                    <span className="reconciliation-header__eyebrow">
                        Importación y conciliación
                    </span>
                    <h1>Conciliación bancaria</h1>
                    <p className="text-muted">
                        Sube el extracto de tu banco, vincula cada movimiento con
                        tus transacciones o créalas al instante.
                    </p>
                </div>

                <div className="reconciliation-header__actions">
                    <SelectInput
                        label="Cuenta"
                        hideLabel
                        compact
                        icon="Wallet"
                        value={accountId}
                        onChange={setAccountId}
                        options={accountOptions}
                        className="reconciliation-account"
                        searchable={false}
                    />
                    <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => refetch()}
                        disabled={isFetching}
                    >
                        <RefreshCw
                            size={15}
                            className={isFetching ? "is-spinning" : ""}
                        />
                        Actualizar
                    </button>
                    <button
                        type="button"
                        className="btn-primary"
                        onClick={() => setImportOpen(true)}
                        disabled={importDisabled}
                    >
                        <Upload size={17} />
                        Importar extracto
                    </button>
                </div>
            </header>

            {error && data && (
                <div className="error-banner">
                    No se pudo actualizar la conciliación. Se muestra la última
                    información disponible.
                </div>
            )}

            <section className="reconciliation-kpis">
                <article className="reconciliation-kpi card">
                    <span className="reconciliation-kpi__icon is-pending">
                        <Clock size={17} />
                    </span>
                    <div>
                        <span>Pendientes</span>
                        <strong className="amount-font">{summary.pending}</strong>
                        <small>Por revisar</small>
                    </div>
                </article>

                <article className="reconciliation-kpi card">
                    <span className="reconciliation-kpi__icon is-matched">
                        <CheckCircle2 size={17} />
                    </span>
                    <div>
                        <span>Conciliados</span>
                        <strong className="amount-font">{summary.matched}</strong>
                        <small>Vinculados a una transacción</small>
                    </div>
                </article>

                <article className="reconciliation-kpi card">
                    <span className="reconciliation-kpi__icon is-imported">
                        <ArrowDownToLine size={17} />
                    </span>
                    <div>
                        <span>Importados</span>
                        <strong className="amount-font">{summary.imported}</strong>
                        <small>Convertidos en transacción</small>
                    </div>
                </article>

                <article className="reconciliation-kpi card">
                    <span className="reconciliation-kpi__icon is-ignored">
                        <EyeOff size={17} />
                    </span>
                    <div>
                        <span>Ignorados</span>
                        <strong className="amount-font">{summary.ignored}</strong>
                        <small>Ocultos del flujo</small>
                    </div>
                </article>
            </section>

            <section className="card reconciliation-toolbar">
                <SearchInput
                    value={search}
                    onChange={setSearch}
                    placeholder="Buscar por descripción..."
                />

                <div
                    className="reconciliation-filters"
                    role="group"
                    aria-label="Filtrar movimientos bancarios"
                >
                    {statusOptions.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            className={`reconciliation-chip ${statusFilter === option.value ? "is-active" : ""}`}
                            onClick={() => setStatusFilter(option.value)}
                        >
                            {option.label}
                            <span>{option.count}</span>
                        </button>
                    ))}
                </div>
            </section>

            {noAccounts ? (
                <div className="empty-state card reconciliation-empty">
                    <span className="reconciliation-empty__icon">
                        <Landmark size={22} />
                    </span>
                    <h3>Primero crea una cuenta</h3>
                    <p className="text-muted">
                        Necesitas una cuenta bancaria para importar y conciliar
                        movimientos.
                    </p>
                    <button
                        className="btn-primary"
                        onClick={() => navigate("/accounts")}
                    >
                        Ir a cuentas
                    </button>
                </div>
            ) : visible.length === 0 ? (
                <div className="empty-state card reconciliation-empty">
                    <span className="reconciliation-empty__icon">
                        <Landmark size={22} />
                    </span>
                    <h3>
                        {search
                            ? "Sin resultados"
                            : statusFilter === "PENDING"
                                ? "Todo conciliado"
                                : "Sin movimientos en este filtro"}
                    </h3>
                    <p className="text-muted">
                        {search
                            ? `No hay movimientos que coincidan con “${search}”.`
                            : statusFilter === "PENDING"
                                ? "No tienes movimientos pendientes. Importa un nuevo extracto para continuar."
                                : "Prueba con otro filtro o importa un extracto bancario."}
                    </p>
                    <button
                        className="btn-primary"
                        onClick={() => setImportOpen(true)}
                        disabled={importDisabled}
                    >
                        <Upload size={16} /> Importar extracto
                    </button>
                </div>
            ) : (
                <div className="reconciliation-list">
                    {visible.map((line) => (
                        <ReconcileLineCard
                            key={line.id}
                            line={line}
                            isBusy={busyLineId === line.id}
                            onMatch={(suggestion) =>
                                handleMatch(line, suggestion.transaction.id)
                            }
                            onCreate={() => setCreatingLine(line)}
                            onIgnore={() =>
                                runLineAction(ignoreLine, line, "Movimiento ignorado")
                            }
                            onRestore={() =>
                                runLineAction(restoreLine, line, "Movimiento restaurado")
                            }
                            onUnmatch={() =>
                                runLineAction(unmatchLine, line, "Vínculo eliminado")
                            }
                        />
                    ))}
                </div>
            )}

            <ModalPortal isOpen={importOpen} onClose={() => setImportOpen(false)}>
                <ImportBankWizard
                    accounts={accounts}
                    defaultAccountId={accountId || undefined}
                    isPending={importBankLines.isPending}
                    error={
                        importBankLines.error instanceof Error
                            ? importBankLines.error.message
                            : null
                    }
                    onSubmit={handleImport}
                    onClose={() => setImportOpen(false)}
                />
            </ModalPortal>

            <ModalPortal
                isOpen={!!creatingLine}
                onClose={() => setCreatingLine(null)}
            >
                {creatingLine && (
                    <CreateFromBankLineModal
                        line={creatingLine}
                        categories={categories}
                        isPending={createFromLine.isPending}
                        error={
                            createFromLine.error instanceof Error
                                ? createFromLine.error.message
                                : null
                        }
                        onSubmit={handleCreate}
                        onClose={() => setCreatingLine(null)}
                    />
                )}
            </ModalPortal>
        </div>
    );
}
