import { AlertTriangle, CheckCircle2, CreditCard, Info, ShieldAlert } from "lucide-react";
import type { Account } from "../types";
import { getCreditMax } from "../utils";
import { formatCurrency } from "../../../shared/utils/formatCurrency";
import "./CreditHealthCard.css";

interface Props {
    accounts: Account[];
}

type HealthTone = "neutral" | "success" | "warning" | "danger";

interface HealthBand {
    label: string;
    impact: string;
    recommendation: string;
    tone: HealthTone;
}

const getHealthBand = (usage: number): HealthBand => {
    if (usage <= 10) {
        return {
            label: "Bajo / inactivo",
            impact: "Neutro a moderado",
            recommendation: "Usa la tarjeta en gastos fijos pequeños para generar historial activo.",
            tone: "neutral",
        };
    }
    if (usage <= 30) {
        return {
            label: "Óptimo",
            impact: "Excelente",
            recommendation: "Rango ideal: mantén este nivel y paga el total antes del vencimiento.",
            tone: "success",
        };
    }
    if (usage <= 50) {
        return {
            label: "Aceptable con alerta",
            impact: "Moderado",
            recommendation: "Controla nuevos gastos y paga antes de la fecha de corte.",
            tone: "warning",
        };
    }
    if (usage <= 80) {
        return {
            label: "Alto riesgo",
            impact: "Negativo",
            recommendation: "Reduce compras en cuotas y amortiza el saldo lo antes posible.",
            tone: "danger",
        };
    }
    return {
        label: "Crítico / sobregiro",
        impact: "Muy negativo",
        recommendation: "Detén el uso de la tarjeta: hay riesgo inminente de sobreendeudamiento.",
        tone: "danger",
    };
};

export function CreditHealthCard({ accounts }: Props) {
    const cards = accounts.filter((account) => account.type === "CREDIT");
    if (cards.length === 0) return null;

    return (
        <section className="card credit-health">
            <div className="credit-health__head">
                <div>
                    <h2>
                        <ShieldAlert size={17} /> Salud de tus tarjetas
                    </h2>
                    <p className="text-muted">
                        El porcentaje de uso de tu línea influye en tu perfil crediticio.
                    </p>
                </div>
                <span className="credit-health__info">
                    <Info size={14} />
                    Compara la TCEA, no solo la TEA: la TCEA incluye comisiones, membresía y seguros.
                </span>
            </div>

            <div className="credit-health__grid">
                {cards.map((account) => {
                    const max = getCreditMax(account);
                    const debt = Math.max(0, max - account.balance);
                    const usage = max > 0 ? Math.round((debt / max) * 100) : 0;
                    const band = getHealthBand(usage);
                    const isHealthy = band.tone === "success";

                    return (
                        <article key={account.id} className={`credit-health__card is-${band.tone}`}>
                            <div className="credit-health__card-head">
                                <span className="credit-health__icon">
                                    <CreditCard size={16} />
                                </span>
                                <div>
                                    <strong>{account.name}</strong>
                                    <small>{account.billingCloseDay ? `Corte día ${account.billingCloseDay}` : "Sin fecha de corte"}{account.paymentDueDay ? ` · Pago día ${account.paymentDueDay}` : ""}</small>
                                </div>
                                <span className="credit-health__usage">{usage}%</span>
                            </div>

                            <div className="credit-health__bar" aria-hidden="true">
                                <span style={{ width: `${Math.min(100, Math.max(2, usage))}%` }} />
                            </div>

                            <div className="credit-health__amounts">
                                <span>Usado {formatCurrency(debt)}</span>
                                <span>de {formatCurrency(max)}</span>
                            </div>

                            <div className="credit-health__status">
                                <span className="credit-health__badge">
                                    {isHealthy ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                                    {band.label}
                                </span>
                                <span>Score: {band.impact}</span>
                            </div>

                            <p className="credit-health__recommendation">{band.recommendation}</p>
                        </article>
                    );
                })}
            </div>
        </section>
    );
}
