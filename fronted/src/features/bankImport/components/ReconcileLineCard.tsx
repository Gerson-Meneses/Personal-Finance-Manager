import dayjs from "dayjs";
import "dayjs/locale/es";
import {
    ArrowDownLeft,
    ArrowUpRight,
    CheckCircle2,
    Clock,
    EyeOff,
    Link2,
    Plus,
    RotateCcw,
    Unlink,
} from "lucide-react";
import { formatCurrency } from "../../../shared/utils/formatCurrency";
import type { BankLineSuggestion, BankStatementLine } from "../types";

dayjs.locale("es");

interface Props {
    line: BankStatementLine;
    isBusy: boolean;
    onMatch: (suggestion: BankLineSuggestion) => void;
    onCreate: () => void;
    onIgnore: () => void;
    onRestore: () => void;
    onUnmatch: () => void;
}

const STATUS_LABEL: Record<BankStatementLine["status"], string> = {
    PENDING: "Pendiente",
    MATCHED: "Conciliado",
    IMPORTED: "Importado",
    IGNORED: "Ignorado",
};

export function ReconcileLineCard({
    line,
    isBusy,
    onMatch,
    onCreate,
    onIgnore,
    onRestore,
    onUnmatch,
}: Props) {
    const isIncome = line.type === "INCOME";
    const sign = isIncome ? "+" : "−";

    return (
        <article className={`bank-line is-${line.status.toLowerCase()}`}>
            <div className="bank-line__main">
                <div className="bank-line__date">
                    <span>{dayjs(`${line.date}T00:00:00`).format("D")}</span>
                    <small>{dayjs(`${line.date}T00:00:00`).format("MMM")}</small>
                </div>

                <div className="bank-line__info">
                    <div className="bank-line__title-row">
                        <strong>{line.description}</strong>
                        <span className={`bank-line__status is-${line.status.toLowerCase()}`}>
                            {line.status === "PENDING" && <Clock size={11} />}
                            {line.status === "MATCHED" && <CheckCircle2 size={11} />}
                            {line.status === "IMPORTED" && <ArrowDownLeft size={11} />}
                            {line.status === "IGNORED" && <EyeOff size={11} />}
                            {STATUS_LABEL[line.status]}
                        </span>
                    </div>

                    <div className="bank-line__meta">
                        <span>{line.account?.name ?? "Cuenta"}</span>
                        {line.reference && (
                            <>
                                <span className="bank-line__dot">·</span>
                                <span>Ref. {line.reference}</span>
                            </>
                        )}
                    </div>
                </div>

                <strong className={`bank-line__amount ${isIncome ? "is-income" : "is-expense"}`}>
                    {sign} {formatCurrency(line.amount)}
                </strong>
            </div>

            {line.status === "PENDING" && line.suggestions.length > 0 && (
                <div className="bank-match">
                    <span className="bank-match__label">
                        <Link2 size={13} /> Posibles coincidencias
                    </span>

                    {line.suggestions.map((suggestion) => (
                        <div
                            key={suggestion.transaction.id}
                            className="bank-match__item"
                        >
                            <div className="bank-match__body">
                                <strong>{suggestion.transaction.name}</strong>
                                <small>
                                    {dayjs(`${suggestion.transaction.date}T00:00:00`).format("D MMM YYYY")}
                                    {suggestion.transaction.category
                                        ? ` · ${suggestion.transaction.category.name}`
                                        : ""}
                                    {" · "}
                                    {suggestion.reasons.join(" · ")}
                                </small>
                            </div>
                            <span className="bank-match__score">
                                {suggestion.score}%
                            </span>
                            <button
                                type="button"
                                className="btn-secondary bank-match__btn"
                                onClick={() => onMatch(suggestion)}
                                disabled={isBusy}
                            >
                                Vincular
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {line.status === "PENDING" && (
                <div className="bank-line__actions">
                    <button
                        type="button"
                        className="btn-primary"
                        onClick={onCreate}
                        disabled={isBusy}
                    >
                        {isIncome ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                        Crear transacción
                    </button>
                    <button
                        type="button"
                        className="btn-secondary"
                        onClick={onIgnore}
                        disabled={isBusy}
                    >
                        <EyeOff size={14} /> Ignorar
                    </button>
                </div>
            )}

            {(line.status === "MATCHED" || line.status === "IMPORTED") &&
                line.transaction && (
                    <div className="bank-line__linked">
                        <div className="bank-line__linked-info">
                            <CheckCircle2 size={15} />
                            <div>
                                <strong>{line.transaction.name}</strong>
                                <small>
                                    {dayjs(`${line.transaction.date}T00:00:00`).format("D MMM YYYY")}
                                    {line.transaction.category
                                        ? ` · ${line.transaction.category.name}`
                                        : ""}
                                </small>
                            </div>
                        </div>

                        {line.status === "MATCHED" && (
                            <button
                                type="button"
                                className="btn-ghost"
                                onClick={onUnmatch}
                                disabled={isBusy}
                            >
                                <Unlink size={13} /> Desvincular
                            </button>
                        )}
                    </div>
                )}

            {line.status === "IGNORED" && (
                <div className="bank-line__actions">
                    <button
                        type="button"
                        className="btn-secondary"
                        onClick={onRestore}
                        disabled={isBusy}
                    >
                        <RotateCcw size={14} /> Restaurar
                    </button>
                </div>
            )}

            {line.status === "PENDING" && line.suggestions.length === 0 && (
                <p className="bank-line__hint">
                    <Plus size={12} /> No encontramos coincidencias. Crea una
                    transacción para conciliarlo.
                </p>
            )}
        </article>
    );
}
