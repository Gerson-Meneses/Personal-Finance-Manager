import { Moon, Sun } from "lucide-react";
import { useTheme } from "./useTheme";
import "./ThemeToggle.css";

export function ThemeToggle({ className = "" }: { className?: string }) {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === "dark";

    return (
        <button
            type="button"
            className={`theme-toggle tooltip-left ${className}`}
            data-tooltip={isDark ? "Tema claro" : "Tema oscuro"}
            aria-label={isDark ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
            onClick={toggleTheme}
        >
            {isDark ? <Sun size={17} /> : <Moon size={17} />}
        </button>
    );
}
