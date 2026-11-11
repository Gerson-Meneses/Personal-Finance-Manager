import dayjs from "dayjs";
import { Link } from "react-router-dom";
import { ArrowRight, CalendarClock } from "lucide-react";
import { formatCurrency } from "../../../shared/utils/formatCurrency";
import { Skeleton } from "../../../shared/components/Skeleton/Skeleton";
import { useRecurringProjection } from "../hooks";
import "./RecurringForecastCard.css";

export function RecurringForecastCard() {
    const month = dayjs().format("YYYY-MM");
    const { projection, loading } = useRecurringProjection(month);

    if (loading && !projection) {
        return (
            <article className="card recurring-forecast">
                <Skeleton className="skeleton-title" />
                <Skeleton className="skeleton-amount" />
                <Skeleton className="skeleton-line" />
                <Skeleton className="skeleton-line" />
            </article>
        );
    }
    if (!projection || projection.occurrences.length === 0) return null;

    const netClass = projection.projectedNet >= 0 ? "text-success" : "text-danger";
    const total = Math.max(projection.expectedIncome + projection.expectedExpense, 1);
    const incomeShare = (projection.expectedIncome / total) * 100;

    return (
        <article className="card recurring-forecast" data-tour="forecast">
            <div className="recurring-forecast__head">
                <h3 className="card-head-title">
                    <CalendarClock size={15} />
                    Flujo previsto
                </h3>
                <Link className="btn-ghost" to="/recurring">
                    Gestionar <ArrowRight size={14} />
                </Link>
            </div>

            <div className="recurring-forecast__net">
                <span>Neto proyectado</span>
                <strong className={`amount-font ${netClass}`}>{formatCurrency(projection.projectedNet)}</strong>
            </div>

            <div className="recurring-forecast__bar" aria-hidden="true">
                <span className="is-income" style={{ width: `${incomeShare}%` }} />
                <span className="is-expense" style={{ width: `${100 - incomeShare}%` }} />
            </div>

            <div className="recurring-forecast__legend">
                <span>
                    <i className="is-income" />
                    Ingresos <strong>{formatCurrency(projection.expectedIncome)}</strong>
                </span>
                <span>
                    <i className="is-expense" />
                    Gastos <strong>{formatCurrency(projection.expectedExpense)}</strong>
                </span>
            </div>

            {projection.dueCount > 0 && (
                <p className="recurring-forecast__due">
                    {projection.dueCount} pago{projection.dueCount !== 1 ? "s" : ""} vence{projection.dueCount !== 1 ? "n" : ""} hoy
                </p>
            )}
        </article>
    );
}
