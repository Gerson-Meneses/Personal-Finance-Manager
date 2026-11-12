import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Sparkles, X } from "lucide-react";
import { focusFirstElement, trapTabKey } from "../../shared/utils/focus";
import "./OnboardingTour.css";

interface Step {
    title: string;
    description: string;
    targets?: string[];
    optional?: boolean;
    route?: string;
    action?: "open-budget-wizard";
    actionLabel?: string;
}

const STEPS: Step[] = [
    {
        title: "Bienvenido a Finance App",
        description: "En pocos pasos aprenderás a registrar movimientos, controlar tus cuentas y anticipar tus gastos.",
    },
    {
        title: "Muévete por la app",
        description: "Usa la navegación superior para ir a transacciones, cuentas, préstamos, pagos futuros, presupuestos y categorías. En móvil, la barra inferior tiene Inicio, Movimientos y Futuros; el resto está en Más.",
        targets: ['[data-tour="nav"]', '[data-tour="bottom-nav"]'],
        optional: true,
    },
    {
        title: "Tu panorama del mes",
        description: "Aquí ves el flujo previsto: ingresos esperados, gastos programados y el neto antes de que ocurran.",
        targets: ['[data-tour="forecast"]'],
        optional: true,
        route: "/",
    },
    {
        title: "Tus cuentas, en un vistazo",
        description: "Consulta saldos y deuda de tarjetas de crédito. Toca una cuenta para abrir su detalle con todos sus movimientos.",
        targets: ['[data-tour="accounts"]'],
        optional: true,
        route: "/",
    },
    {
        title: "Registra un movimiento",
        description: "Usa el botón + para crear una transacción desde cualquier vista. El formulario se adapta a móvil y escritorio.",
        targets: ['[data-tour="new-transaction-mobile"]', '[data-tour="new-transaction"]'],
        optional: true,
    },
    {
        title: "Pagos futuros y presupuestos",
        description: "Programa sueldos, alquileres, cuotas de préstamos o dinero que planeas prestar. También puedes confirmar los pagos cuando venzan.",
    },
    {
        title: "Tu presupuesto, con montos sugeridos",
        description: "Calculamos montos sugeridos con tus gastos recientes. Ajusta las categorías y guárdalas sin salir del tutorial.",
        targets: ['[data-tour="budget-suggestions"]'],
        optional: true,
        route: "/budgets",
        action: "open-budget-wizard",
        actionLabel: "Configurar mi presupuesto",
    },
    {
        title: "Nunca pierdas un vencimiento",
        description: "La campana reúne avisos de ingresos y pagos futuros que vencen hoy. Márcalos como leídos cuando los revises.",
        targets: ['[data-tour="notifications"]'],
        optional: true,
    },
    {
        title: "Todo listo",
        description: "Ya puedes empezar. Si necesitas repasar el tutorial, puedes abrirlo de nuevo desde Mi perfil (o desde Más en el móvil).",
    },
];

const KEY_VERSION = "v1";
const TARGET_RETRY_MS = 120;
const TARGET_TIMEOUT_MS = 4000;

function isValidRect(rect: DOMRect | null | undefined): rect is DOMRect {
    return !!rect && rect.width > 0 && rect.height > 0;
}

function findTarget(selectors?: string[]): HTMLElement | null {
    if (!selectors?.length) return null;
    return (
        selectors
            .map((selector) => document.querySelector<HTMLElement>(selector))
            .find((element) => isValidRect(element?.getBoundingClientRect())) ?? null
    );
}

export function OnboardingTour({ userId, autoStart = false }: { userId: string; autoStart?: boolean }) {
    const storageKey = `finance-onboarding-${KEY_VERSION}-${userId}`;
    const visibleSteps = STEPS;
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const [open, setOpen] = useState(false);
    const [index, setIndex] = useState(0);
    const [rect, setRect] = useState<DOMRect | null>(null);
    const cardRef = useRef<HTMLElement>(null);

    const step = visibleSteps[index];
    const isLast = index === visibleSteps.length - 1;

    const markDone = useCallback(() => {
        window.localStorage.setItem(storageKey, "done");
        setOpen(false);
    }, [storageKey]);

    const runStepAction = () => {
        if (step?.action === "open-budget-wizard") {
            markDone();
            window.setTimeout(() => {
                window.dispatchEvent(new CustomEvent("finance:open-budget-wizard"));
            }, 80);
        }
    };

    useEffect(() => {
        if (!userId || !autoStart) return;
        if (window.localStorage.getItem(storageKey) !== "done") {
            const timer = window.setTimeout(() => setOpen(true), 900);
            return () => window.clearTimeout(timer);
        }
    }, [autoStart, storageKey, userId]);

    useEffect(() => {
        const openTour = () => {
            setIndex(0);
            setOpen(true);
        };
        window.addEventListener("finance:open-onboarding", openTour);
        return () => window.removeEventListener("finance:open-onboarding", openTour);
    }, []);

    useEffect(() => {
        if (!open || !step?.route) return;
        if (pathname !== step.route) navigate(step.route);
    }, [open, step, pathname, navigate]);

    const updateRect = useCallback(() => {
        if (!open || !step?.targets?.length) {
            setRect(null);
            return;
        }

        setRect(findTarget(step.targets)?.getBoundingClientRect() ?? null);
    }, [open, step]);

    useEffect(() => {
        if (!open) return;

        const frame = requestAnimationFrame(updateRect);
        const onChange = () => updateRect();
        window.addEventListener("resize", onChange);
        window.addEventListener("scroll", onChange, true);
        return () => {
            cancelAnimationFrame(frame);
            window.removeEventListener("resize", onChange);
            window.removeEventListener("scroll", onChange, true);
        };
    }, [open, updateRect]);

    useEffect(() => {
        if (!open || !step?.targets?.length) return;
        if (step.route && pathname !== step.route) return;

        let cancelled = false;
        let timer: number | undefined;
        const startedAt = Date.now();

        const attempt = () => {
            if (cancelled) return;

            const target = findTarget(step.targets);
            if (target) {
                const targetRect = target.getBoundingClientRect();
                const isVisible = targetRect.top >= 8 && targetRect.bottom <= window.innerHeight - 8;
                if (!isVisible) {
                    target.scrollIntoView({ block: "center", behavior: "smooth" });
                }
                setRect(targetRect);
                return;
            }

            if (Date.now() - startedAt >= TARGET_TIMEOUT_MS) {
                if (step.optional) {
                    setIndex((value) => Math.min(value + 1, STEPS.length - 1));
                }
                return;
            }

            timer = window.setTimeout(attempt, TARGET_RETRY_MS);
        };

        attempt();

        return () => {
            cancelled = true;
            if (timer) window.clearTimeout(timer);
        };
    }, [open, step, pathname]);

    useEffect(() => {
        if (!open) return;

        const previousFocus = document.activeElement as HTMLElement | null;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        const frame = requestAnimationFrame(() => {
            focusFirstElement(cardRef.current);
        });

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Tab") {
                trapTabKey(event, cardRef.current);
            }
        };
        document.addEventListener("keydown", onKeyDown);

        return () => {
            cancelAnimationFrame(frame);
            document.removeEventListener("keydown", onKeyDown);
            document.body.style.overflow = previousOverflow;
            if (previousFocus?.isConnected) previousFocus.focus();
        };
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") markDone();
            if (event.key === "ArrowRight" && !isLast) setIndex((value) => value + 1);
            if (event.key === "ArrowLeft" && index > 0) setIndex((value) => value - 1);
        };
        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, [open, index, isLast, markDone]);

    if (!open || !step) return null;

    const spotlightStyle = rect
        ? {
            left: `${Math.max(8, rect.left - 6)}px`,
            top: `${Math.max(8, rect.top - 6)}px`,
            width: `${Math.min(window.innerWidth - 16, rect.width + 12)}px`,
            height: `${rect.height + 12}px`,
        }
        : undefined;

    return createPortal(
        <div className="onboarding-tour" aria-live="polite">
            <div className="onboarding-tour__blocker" />
            {rect ? (
                <div className="onboarding-tour__spotlight" style={spotlightStyle} />
            ) : (
                <div className="onboarding-tour__dim" />
            )}

            <section
                ref={cardRef}
                className="onboarding-tour__card"
                role="dialog"
                aria-modal="true"
                aria-label="Tutorial de bienvenida"
                tabIndex={-1}
            >
                <button
                    type="button"
                    className="onboarding-tour__close"
                    onClick={markDone}
                    aria-label="Cerrar tutorial"
                >
                    <X size={16} />
                </button>

                <span className="onboarding-tour__spark"><Sparkles size={18} /></span>

                <div className="onboarding-tour__progress">
                    <span>{index + 1}</span> de {visibleSteps.length}
                </div>

                <h2>{step.title}</h2>
                <p>{step.description}</p>

                {step.action && step.actionLabel && (
                    <button
                        type="button"
                        className="onboarding-tour__action"
                        onClick={runStepAction}
                    >
                        <Sparkles size={15} />
                        {step.actionLabel}
                    </button>
                )}

                <div className="onboarding-tour__dots" aria-hidden="true">
                    {visibleSteps.map((item, dotIndex) => (
                        <span key={item.title} className={dotIndex === index ? "is-active" : ""} />
                    ))}
                </div>

                <div className="onboarding-tour__actions">
                    <button type="button" className="onboarding-tour__ghost" onClick={markDone}>
                        Saltar
                    </button>

                    <div className="onboarding-tour__nav">
                        <button
                            type="button"
                            className="onboarding-tour__icon"
                            onClick={() => setIndex((value) => Math.max(0, value - 1))}
                            disabled={index === 0}
                            aria-label="Paso anterior"
                        >
                            <ArrowLeft size={16} />
                        </button>

                        <button
                            type="button"
                            className="onboarding-tour__primary"
                            onClick={() => {
                                if (isLast) markDone();
                                else setIndex((value) => value + 1);
                            }}
                        >
                            {isLast ? (
                                <>
                                    Empezar <Check size={15} />
                                </>
                            ) : (
                                <>
                                    Siguiente <ArrowRight size={15} />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </section>
        </div>,
        document.body
    );
}
