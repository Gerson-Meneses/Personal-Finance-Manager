import { useEffect, useRef, useState, type ComponentType } from "react";
import { Check, Moon, Snowflake, Sun, TreePine } from "lucide-react";
import { useTheme } from "./useTheme";
import type { Theme } from "./themeContext";
import "./ThemeToggle.css";

interface ThemeOption {
    value: Theme;
    label: string;
    hint: string;
    icon: ComponentType<{ size?: number }>;
}

const THEME_OPTIONS: ThemeOption[] = [
    { value: "light", label: "Claro", hint: "Luminoso y sobrio", icon: Sun },
    { value: "dark", label: "Oscuro", hint: "Contraste clásico", icon: Moon },
    { value: "midnight", label: "Midnight Luxury", hint: "Navidad elegante", icon: Snowflake },
    { value: "noel", label: "Navidad", hint: "Pino, oro y nieve", icon: TreePine },
];

export function ThemeToggle({ className = "" }: { className?: string }) {
    const { theme, setTheme } = useTheme();
    const [open, setOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const toggleRef = useRef<HTMLButtonElement>(null);

    const current = THEME_OPTIONS.find((option) => option.value === theme) ?? THEME_OPTIONS[1];
    const CurrentIcon = current.icon;

    useEffect(() => {
        if (!open) return;

        const onPointerDown = (event: MouseEvent) => {
            if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
        };
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setOpen(false);
                toggleRef.current?.focus();
            }
        };

        document.addEventListener("mousedown", onPointerDown);
        document.addEventListener("keydown", onKeyDown);
        const frame = requestAnimationFrame(() => {
            menuRef.current
                ?.querySelector<HTMLButtonElement>('[aria-checked="true"]')
                ?.focus();
        });

        return () => {
            cancelAnimationFrame(frame);
            document.removeEventListener("mousedown", onPointerDown);
            document.removeEventListener("keydown", onKeyDown);
        };
    }, [open]);

    return (
        <div className={`theme-switcher ${className}`} ref={rootRef}>
            <button
                ref={toggleRef}
                type="button"
                className="theme-toggle tooltip-left"
                data-tooltip="Tema"
                aria-label={`Cambiar tema. Actual: ${current.label}`}
                aria-haspopup="menu"
                aria-expanded={open}
                onClick={() => setOpen((value) => !value)}
            >
                <CurrentIcon size={17} />
            </button>

            {open && (
                <div className="theme-menu" role="menu" aria-label="Seleccionar tema" ref={menuRef}>
                    <span className="theme-menu__title">Tema de la app</span>

                    {THEME_OPTIONS.map((option) => {
                        const Icon = option.icon;
                        const selected = option.value === theme;
                        return (
                            <button
                                key={option.value}
                                type="button"
                                role="menuitemradio"
                                aria-checked={selected}
                                className={`theme-menu__option ${selected ? "is-selected" : ""}`}
                                onClick={() => {
                                    setTheme(option.value);
                                    setOpen(false);
                                    toggleRef.current?.focus();
                                }}
                            >
                                <span className="theme-menu__icon"><Icon size={16} /></span>
                                <span className="theme-menu__text">
                                    <strong>{option.label}</strong>
                                    <small>{option.hint}</small>
                                </span>
                                {selected && <Check size={15} className="theme-menu__check" />}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
