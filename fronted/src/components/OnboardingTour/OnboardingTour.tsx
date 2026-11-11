import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, ArrowRight, Check, Sparkles, X } from "lucide-react";
import { focusFirstElement, trapTabKey } from "../../shared/utils/focus";
import "./OnboardingTour.css";

interface Step {
    title: string;
    description: string;
    targets?: string[];
    optional?: boolean;
}

const STEPS: Step[] = [
    {
        title: "Bienvenido a Finance App",
        description: "En pocos pasos aprenderás a registrar movimientos, controlar tus cuentas y anticipar tus gastos.",
    },
    {
        title: "Muévete por la app",
        description: "Usa la navegación para ir a movimientos, cuentas, préstamos, previstos o presupuestos. En móvil, la barra inferior siempre está a mano.",
        targets: ['[data-tour="nav"]', '[data-tour="bottom-nav"]'],
        optional: true,
    },
    {
        title: "Tu panorama del mes",
        description: "Aquí ves el flujo previsto: ingresos esperados, gastos programados y el neto antes de que ocurran.",
        targets: ['[data-tour="forecast"]'],
        optional: true,
    },
    {
        title: "Tus cuentas, en un vistazo",
        description: "Consulta saldos, deuda de tarjetas y movimientos recientes. Toca una cuenta para entrar a su detalle.",
        targets: ['[data-tour="accounts"]'],
        optional: true,
    },
    {
        title: "Registra un movimiento",
        description: "Usa el botón + para crear una transacción desde cualquier vista. El formulario se adapta a móvil y escritorio.",
        targets: ['[data-tour="new-transaction-mobile"]', '[data-tour="new-transaction"]'],
        optional: true,
    },
    {
        title: "Pagos previstos y presupuestos",
        description: "Programa sueldos, alquileres o suscripciones, define presupuestos por categoría y confirma pagos cuando llegue la fecha.",
    },
    {
        title: "Nunca pierdas un vencimiento",
        description: "La campana reúne avisos de pagos próximos y movimientos recurrentes. Márcalos como leídos cuando los revises.",
        targets: ['[data-tour="notifications"]'],
        optional: true,
    },
    {
        title: "Todo listo",
        description: "Ya puedes empezar. Si necesitas repasar el tutorial, puedes abrirlo de nuevo desde el menú.",
    },
];

const KEY_VERSION = "v1";

function isValidRect(rect: DOMRect | null | undefined): rect is DOMRect {
    return !!rect && rect.width > 0 && rect.height > 0;
}

export function OnboardingTour({ userId, autoStart = false }: { userId: string; autoStart?: boolean }) {
    const storageKey = `finance-onboarding-${KEY_VERSION}-${userId}`;
    const visibleSteps = STEPS;
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

    const updateRect = useCallback(() => {
        if (!open || !step?.targets?.length) {
            setRect(null);
            return;
        }

        const target = step.targets
            .map((selector) => document.querySelector<HTMLElement>(selector))
            .find((element) => isValidRect(element?.getBoundingClientRect()));

        setRect(target?.getBoundingClientRect() ?? null);
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
        const target = step.targets
            .map((selector) => document.querySelector<HTMLElement>(selector))
            .find((element) => isValidRect(element?.getBoundingClientRect()));
        if (!target) return;

        const targetRect = target.getBoundingClientRect();
        const isVisible = targetRect.top >= 0 && targetRect.bottom <= window.innerHeight;
        if (!isVisible) {
            target.scrollIntoView({ block: "center", behavior: "smooth" });
            window.setTimeout(updateRect, 350);
        }
    }, [open, step, updateRect]);

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
